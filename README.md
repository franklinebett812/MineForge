# MineForge — Mining Hardware Storefront

A standalone, responsive HTML/CSS/JavaScript storefront inspired by the general structure of the referenced mining-hardware landing page.

## Files
- `index.html` — page structure
- `style.css` — responsive styling
- `script.js` — products, filtering and demo order modal

## Run
Open `index.html` directly in a browser, or use the VS Code Live Server extension.

## Customize
Edit the `products` array in `script.js` to change names, specifications and prices.

## Production notes
The order form is intentionally a demo. Before accepting real orders or payments, connect it to your own backend, database and a legitimate payment processor. Add your real business identity, policies, shipping terms and product images.

No proprietary source code, logos, images or payment credentials from the referenced site are included.

## Payments

The payment review page calls the Flask service in `payment-backend/` to create a NOWPayments invoice. Configure the backend using `payment-backend/.env.example`; never put NOWPayments credentials in frontend JavaScript.


## Login page
Open `login.html` for the new Bitcoin-themed login page. It includes email, Google and phone-number UI and is ready to be connected to Firebase Authentication. `FIREBASE_SETUP.md` contains the setup checklist.
