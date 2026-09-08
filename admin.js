import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { get, getDatabase, onValue, push, ref, remove, set, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const $ = selector => document.querySelector(selector);
const status = $("#status");
const rows = $("#productRows");
const orderRows = $("#orderRows");
const userRows = $("#userRows");
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const database = app ? getDatabase(app) : null;
const productsRef = database ? ref(database, "products") : null;
let products = {};

const sampleProducts = {
  antminerS19Pro: { name: "Antminer S19 Pro", type: "asic", tag: "ASIC", spec: "110 TH/s · ~29.5 J/TH", price: "$2,850", note: "Limited allocation", active: true },
  whatsminerM30S: { name: "WhatsMiner M30S++", type: "asic", tag: "ASIC", spec: "112 TH/s · ~31 J/TH", price: "$2,650", note: "Batch closing soon", active: true },
  antminerS21: { name: "Antminer S21", type: "asic", tag: "NEXT GEN", spec: "200 TH/s · ~17.5 J/TH", price: "$4,950", note: "New release", active: true },
  whatsminerM50S: { name: "WhatsMiner M50S", type: "asic", tag: "ASIC", spec: "126 TH/s · Industrial cooling", price: "$3,150", note: "Limited units", active: true },
  gpuRig3080: { name: "GPU Rig — 8× RTX 3080", type: "gpu", tag: "GPU RIG", spec: "≈760 MH/s · Tuned configuration", price: "$4,200", note: "Custom build", active: true },
  gpuRig3070: { name: "GPU Rig — 6× RTX 3070", type: "gpu", tag: "GPU RIG", spec: "≈360 MH/s · Low power", price: "$3,200", note: "Limited units", active: true },
  kaspaKs5Pro: { name: "Kaspa ASIC KS5 Pro", type: "asic", tag: "ASIC", spec: "21 TH/s · KHeavyHash", price: "$6,800", note: "Extremely limited supply", active: true }
};

function showStatus(message, type = "") {
  status.textContent = message;
  status.className = `status ${type}`;
}

function renderProducts() {
  const entries = Object.entries(products);
  $("#productCount").textContent = `${entries.length} product${entries.length === 1 ? "" : "s"}`;
  if (!entries.length) {
    rows.innerHTML = '<tr><td colspan="5" class="empty">No products yet. Add one or load the sample catalog.</td></tr>';
    return;
  }
  rows.innerHTML = entries.map(([id, product]) => `
    <tr>
      <td><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.spec)}</small></td>
      <td>${escapeHtml(product.type || "")}</td>
      <td>${escapeHtml(product.price || "")}</td>
      <td><span class="badge ${product.active === false ? "off" : ""}">${product.active === false ? "Hidden" : "Live"}</span></td>
      <td><div class="row-actions"><button data-edit="${id}" type="button">Edit</button><button class="delete" data-delete="${id}" type="button">Delete</button></div></td>
    </tr>`).join("");
  rows.querySelectorAll("[data-edit]").forEach(button => button.onclick = () => startEdit(button.dataset.edit));
  rows.querySelectorAll("[data-delete]").forEach(button => button.onclick = () => deleteProduct(button.dataset.delete));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function renderOrders(orders) {
  const entries = Object.values(orders || {}).sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
  $("#orderCount").textContent = `${entries.length} order${entries.length === 1 ? "" : "s"}`;
  orderRows.innerHTML = entries.length ? entries.map(order => `
    <tr><td><strong>${escapeHtml(order.customerName || "Unknown")}</strong><small>${escapeHtml(order.email || "")}</small></td><td>${escapeHtml(order.productName || "—")}</td><td>${escapeHtml(order.price || "—")}</td><td><span class="badge">${escapeHtml(order.status || "pending")}</span></td><td>${formatDate(order.createdAt)}</td></tr>`).join("") : '<tr><td colspan="5" class="empty">No orders yet.</td></tr>';
}

function renderUsers(users) {
  const entries = Object.values(users || {});
  $("#userCount").textContent = `${entries.length} user${entries.length === 1 ? "" : "s"}`;
  userRows.innerHTML = entries.length ? entries.map(user => `
    <tr><td><strong>${escapeHtml(user.displayName || "Unnamed user")}</strong><small>${escapeHtml(user.email || "—")}</small></td><td>${escapeHtml(user.phoneNumber || "—")}</td><td><span class="badge ${user.role === "admin" ? "admin-badge" : ""}">${escapeHtml(user.role || "user")}</span></td><td>${formatDate(user.lastLoginAt)}</td></tr>`).join("") : '<tr><td colspan="4" class="empty">No user profiles found.</td></tr>';
}

function resetForm() {
  $("#productForm").reset();
  $("#productId").value = "";
  $("#active").checked = true;
  $("#formTitle").textContent = "Add product";
  $("#cancelEdit").hidden = true;
}

function startEdit(id) {
  const product = products[id];
  if (!product) return;
  $("#productId").value = id;
  $("#name").value = product.name || "";
  $("#type").value = product.type || "asic";
  $("#tag").value = product.tag || "";
  $("#spec").value = product.spec || "";
  $("#price").value = product.price || "";
  $("#note").value = product.note || "";
  $("#active").checked = product.active !== false;
  $("#formTitle").textContent = "Edit product";
  $("#cancelEdit").hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteProduct(id) {
  if (!products[id] || !window.confirm(`Delete ${products[id].name}?`)) return;
  try {
    await remove(ref(database, `products/${id}`));
    showStatus("Product deleted.", "success");
  } catch (error) {
    showStatus("Could not delete product. Check your database rules.", "error");
  }
}

$("#productForm").onsubmit = async event => {
  event.preventDefault();
  const id = $("#productId").value || push(productsRef).key;
  const product = {
    name: $("#name").value.trim(),
    type: $("#type").value,
    tag: $("#tag").value.trim(),
    spec: $("#spec").value.trim(),
    price: $("#price").value.trim(),
    note: $("#note").value.trim(),
    active: $("#active").checked
  };
  try {
    await set(ref(database, `products/${id}`), product);
    showStatus("Product saved.", "success");
    resetForm();
  } catch (error) {
    showStatus("Could not save product. Check your database rules.", "error");
  }
};

$("#cancelEdit").onclick = resetForm;
$("#seedButton").onclick = async () => {
  if (!window.confirm("Load the sample catalog into Realtime Database? Existing products with the same IDs will be replaced.")) return;
  try {
    await update(productsRef, sampleProducts);
    showStatus("Sample catalog loaded.", "success");
  } catch (error) {
    showStatus("Could not load catalog. Check your database rules.", "error");
  }
};
$("#logoutButton").onclick = () => signOut(auth);

if (!isFirebaseConfigured) {
  showStatus("Firebase is not configured.", "error");
} else {
  onAuthStateChanged(auth, async user => {
    if (!user) {
      window.location.replace("login.html?redirect=/admin.html");
      return;
    }
    try {
      const roleSnapshot = await get(ref(database, `users/${user.uid}/role`));
      if (roleSnapshot.val() !== "admin") {
        $("#accessDenied").hidden = false;
        return;
      }
      $("#adminEmail").textContent = user.email || user.phoneNumber || "Administrator";
      onValue(ref(database, "products"), snapshot => {
        products = snapshot.val() || {};
        renderProducts();
      }, () => showStatus("Could not read products. Check your database rules.", "error"));
      onValue(ref(database, "orders"), snapshot => renderOrders(snapshot.val()), () => showStatus("Could not read orders. Check your database rules.", "error"));
      onValue(ref(database, "users"), snapshot => renderUsers(snapshot.val()), () => showStatus("Could not read users. Check your database rules.", "error"));
    } catch (error) {
      showStatus("Could not verify your administrator role.", "error");
    }
  });
}
