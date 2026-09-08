import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { get, getDatabase, ref } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const status = document.querySelector("#paymentStatus");
const summary = document.querySelector("#orderSummary");
const paymentButton = document.querySelector("#paymentButton");
const orderId = new URLSearchParams(window.location.search).get("orderId");

function showError(message) {
  status.textContent = message;
  status.className = "error";
}

if (!isFirebaseConfigured || !orderId) {
  showError("This payment link is invalid or Firebase is not configured.");
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase(app);

  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace(`login.html?redirect=${encodeURIComponent(`/payment.html?orderId=${orderId}`)}`);
      return;
    }
    try {
      const snapshot = await get(ref(database, `orders/${orderId}`));
      const order = snapshot.val();
      if (!order || order.uid !== user.uid) {
        showError("This order could not be found for your account.");
        return;
      }
      document.querySelector("#orderProduct").textContent = order.productName || "Product";
      document.querySelector("#orderSpec").textContent = order.productSpec || "—";
      document.querySelector("#orderCustomer").textContent = order.email || order.customerName || "—";
      document.querySelector("#orderPrice").textContent = order.price || "—";
      status.textContent = "Order saved. Review the details before payment.";
      summary.hidden = false;
      paymentButton.disabled = false;
      paymentButton.onclick = () => alert("Connect your payment provider here before accepting funds.");
    } catch (error) {
      console.error("Unable to load order", error);
      showError("Unable to load this order. Check your database rules and try again.");
    }
  });
}
