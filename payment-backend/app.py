import os
import re
import hmac
import hashlib
from decimal import Decimal, InvalidOperation
from functools import wraps
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
import json

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import auth, credentials, db

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("FRONTEND_ORIGIN", "*")}})

NOWPAYMENTS_URL = "https://api.nowpayments.io/v1/invoice"


def init_firebase():
    if firebase_admin._apps:
        return
    service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if service_account_path:
        firebase_admin.initialize_app(
            credentials.Certificate(service_account_path),
            {"databaseURL": os.environ["FIREBASE_DATABASE_URL"]},
        )
        return
    firebase_admin.initialize_app(options={"databaseURL": os.environ["FIREBASE_DATABASE_URL"]})


try:
    init_firebase()
except (KeyError, ValueError, OSError) as error:
    raise RuntimeError("Firebase backend configuration is incomplete") from error


def require_firebase_user(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Firebase authorization required"}), 401
        try:
            user = auth.verify_id_token(header.removeprefix("Bearer ").strip())
        except Exception:
            return jsonify({"error": "Invalid Firebase authorization token"}), 401
        return handler(user, *args, **kwargs)

    return wrapped


def parse_price(value):
    if not isinstance(value, str):
        raise ValueError("Order price is invalid")
    cleaned = re.sub(r"[^0-9.]", "", value)
    try:
        amount = Decimal(cleaned)
    except InvalidOperation as error:
        raise ValueError("Order price is invalid") from error
    if amount <= 0 or amount > Decimal("10000000"):
        raise ValueError("Order price is outside the allowed range")
    return format(amount.quantize(Decimal("0.01")), "f")


def create_nowpayments_invoice(order_id, order):
    api_key = os.getenv("NOWPAYMENTS_API_KEY")
    if not api_key:
        raise RuntimeError("NOWPAYMENTS_API_KEY is not configured")
    callback_url = os.getenv("NOWPAYMENTS_IPN_CALLBACK_URL")
    if not callback_url:
        raise RuntimeError("NOWPAYMENTS_IPN_CALLBACK_URL is not configured")

    payload = {
        "price_amount": parse_price(order.get("price")),
        "price_currency": os.getenv("NOWPAYMENTS_PRICE_CURRENCY", "usd"),
        "order_id": order_id,
        "order_description": order.get("productName", "MineForge order"),
        "ipn_callback_url": callback_url,
        "success_url": os.getenv("NOWPAYMENTS_SUCCESS_URL", ""),
        "cancel_url": os.getenv("NOWPAYMENTS_CANCEL_URL", ""),
    }
    payload = {key: value for key, value in payload.items() if value}
    body = json.dumps(payload).encode("utf-8")
    request_data = Request(
        NOWPAYMENTS_URL,
        data=body,
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request_data, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"NOWPayments rejected the invoice: {detail}") from error
    except (URLError, json.JSONDecodeError) as error:
        raise RuntimeError("NOWPayments is unavailable") from error


@app.post("/api/create-payment")
@require_firebase_user
def create_payment(user):
    body = request.get_json(silent=True) or {}
    order_id = body.get("orderId")
    if not isinstance(order_id, str) or not order_id or len(order_id) > 128:
        return jsonify({"error": "A valid order ID is required"}), 400

    order = db.reference(f"orders/{order_id}").get()
    if not order or order.get("uid") != user["uid"]:
        return jsonify({"error": "Order not found"}), 404
    if order.get("status") not in ("pending_payment", "payment_failed"):
        return jsonify({"error": "This order is not available for payment"}), 409

    try:
        invoice = create_nowpayments_invoice(order_id, order)
        db.reference(f"orders/{order_id}").update({
            "status": "payment_pending",
            "paymentInvoiceId": invoice.get("id"),
            "paymentUrl": invoice.get("invoice_url"),
        })
        return jsonify({"paymentUrl": invoice.get("invoice_url"), "invoiceId": invoice.get("id")})
    except (RuntimeError, ValueError) as error:
        return jsonify({"error": str(error)}), 502


@app.post("/api/nowpayments-ipn")
def nowpayments_ipn():
    signature = request.headers.get("x-nowpayments-sig", "")
    ipn_secret = os.getenv("NOWPAYMENTS_IPN_SECRET")
    if not ipn_secret:
        return jsonify({"error": "IPN secret is not configured"}), 503
    payload = request.get_json(silent=True) or {}
    canonical_payload = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    expected_signature = hmac.new(ipn_secret.encode("utf-8"), canonical_payload, hashlib.sha512).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({"error": "Invalid IPN signature"}), 401
    order_id = payload.get("order_id")
    if not order_id:
        return jsonify({"error": "Missing order_id"}), 400
    status = payload.get("payment_status", "unknown")
    allowed_statuses = {"waiting", "confirming", "confirmed", "finished", "failed", "refunded", "expired"}
    if status not in allowed_statuses:
        status = "unknown"
    db.reference(f"orders/{order_id}").update({
        "paymentStatus": status,
        "paymentUpdatedAt": {".sv": "timestamp"},
        "paymentId": payload.get("payment_id"),
    })
    return jsonify({"ok": True})


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG") == "1")
