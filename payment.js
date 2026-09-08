import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { get, getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const status = document.querySelector("#paymentStatus");
const summary = document.querySelector("#orderSummary");
const paymentButton = document.querySelector("#paymentButton");
const orderId = new URLSearchParams(window.location.search).get("orderId");
const paymentBackendUrl = window.PAYMENT_BACKEND_URL || "https://mineforge.pythonanywhere.com/api";

function showError(message) {
  status.textContent = message;
  status.className = "error";
}

function updatePaymentState(order) {
  const paymentStatus = order.paymentStatus || order.status;
  const messages = {
    waiting: "Payment created. Waiting for your transfer.",
    confirming: "Payment received and confirming on the network.",
    confirmed: "Payment confirmed successfully.",
    finished: "Payment completed successfully.",
    failed: "Payment failed. You can try again.",
    expired: "Payment expired. Please create a new payment.",
    refunded: "This payment was refunded."
  };
  status.textContent = messages[paymentStatus] || "Order saved. Review the details before payment.";
  status.className = ["confirmed", "finished"].includes(paymentStatus) ? "success" : "muted";
  if (["confirmed", "finished"].includes(paymentStatus)) {
    paymentButton.disabled = true;
    paymentButton.textContent = "Payment completed";
  } else if (["failed", "expired"].includes(paymentStatus)) {
    paymentButton.disabled = false;
    paymentButton.textContent = "Try payment again";
  }
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
      const orderReference = ref(database, `orders/${orderId}`);
      const snapshot = await get(orderReference);
      const order = snapshot.val();
      if (!order || order.uid !== user.uid) {
        showError("This order could not be found for your account.");
        return;
      }
      document.querySelector("#orderProduct").textContent = order.productName || "Product";
      document.querySelector("#orderSpec").textContent = order.productSpec || "—";
      document.querySelector("#orderCustomer").textContent = order.email || order.customerName || "—";
      document.querySelector("#orderAddress").textContent = order.physicalAddress || "—";
      document.querySelector("#orderPrice").textContent = order.price || "—";
      summary.hidden = false;
      paymentButton.disabled = false;
      updatePaymentState(order);
      paymentButton.onclick = async () => {
        paymentButton.disabled = true;
        paymentButton.textContent = "Creating secure payment...";
        try {
          const response = await fetch(`${paymentBackendUrl}/create-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              order: {
                productName: order.productName,
                price: order.price,
                customerEmail: order.email || user.email,
                customerName: order.customerName,
                phone: order.phone,
                physicalAddress: order.physicalAddress
              }
            })
          });
          const result = await response.json();
          if (!response.ok || !result.paymentUrl) throw new Error(result.error || "Payment could not be created");
          window.location.href = result.paymentUrl;
        } catch (error) {
          console.error("Unable to create payment", error);
          showError(error.message || "Unable to start payment. Please try again.");
          paymentButton.disabled = false;
          paymentButton.textContent = "Continue to secure payment";
        }
      };
      onValue(orderReference, liveSnapshot => {
        const liveOrder = liveSnapshot.val();
        if (liveOrder && liveOrder.uid === user.uid) updatePaymentState(liveOrder);
      });
    } catch (error) {
      console.error("Unable to load order", error);
      showError("Unable to load this order. Check your database rules and try again.");
    }
  });
}
