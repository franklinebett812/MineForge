# MineForge payment backend

This Flask service creates NOWPayments invoices without exposing the API key to the browser.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, and the public callback/success URLs.
4. Install dependencies:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

5. Start the API:

```bash
python app.py
```

The browser calls `POST /api/create-payment` with the order snapshot and the API creates a NOWPayments invoice. This backend does not import, verify, read, or write Firebase.

The frontend remains responsible for Firebase Authentication and order records. Because the backend no longer verifies Firebase tokens or reads Firebase orders, deploy it behind a trusted frontend or add another server-side authentication/signing layer before accepting real payments. The backend validates the request shape and amount range, but a public client can otherwise alter submitted order details.

## NOWPayments configuration

In NOWPayments, configure the IPN secret and use the public URL of:

```text
https://YOUR_BACKEND_HOST/api/nowpayments-ipn
```

The backend verifies `x-nowpayments-sig` and logs the payment status. It does not update Firebase. The callback must be publicly reachable over HTTPS in production.

For production, set `window.PAYMENT_BACKEND_URL` to the deployed API URL before loading `payment.js`, or replace the local default in that module.

Never commit `.env` or NOWPayments credentials.
