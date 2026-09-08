# MineForge payment backend

This Flask service creates NOWPayments invoices without exposing the API key to the browser.

## Setup

1. Create a Firebase service-account key and keep it outside the web project.
2. Copy `.env.example` to `.env`.
3. Fill in `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`, `GOOGLE_APPLICATION_CREDENTIALS`, and the public callback/success URLs.
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

The browser calls `POST /api/create-payment` with a Firebase ID token. The API reads the order from Firebase, verifies that the order belongs to that user, and creates a NOWPayments invoice from the stored order price.

## NOWPayments configuration

In NOWPayments, configure the IPN secret and use the public URL of:

```text
https://YOUR_BACKEND_HOST/api/nowpayments-ipn
```

The backend verifies `x-nowpayments-sig` before changing an order's payment status. The callback must be publicly reachable over HTTPS in production.

For production, set `window.PAYMENT_BACKEND_URL` to the deployed API URL before loading `payment.js`, or replace the local default in that module.

Never commit `.env`, Firebase service-account JSON, or NOWPayments credentials.
