import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, onValue, push, ref, serverTimestamp, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const loginLink=document.querySelector("#loginLink");
const accountMenu=document.querySelector("#accountMenu");
const accountTrigger=document.querySelector("#accountTrigger");
const accountDropdown=document.querySelector("#accountDropdown");
const accountAvatar=document.querySelector("#accountAvatar");
const accountLabel=document.querySelector("#accountLabel");
const accountName=document.querySelector("#accountName");
const accountEmail=document.querySelector("#accountEmail");
const profileModal=document.querySelector("#profileModal");
const profileName=document.querySelector("#profileName");
const profileEmail=document.querySelector("#profileEmail");
const profilePhone=document.querySelector("#profilePhone");
let currentUser=null;
let auth=null;
let database=null;

function closeAccountMenu(){
 accountDropdown.hidden=true;
 accountTrigger.setAttribute("aria-expanded","false");
}

function updateAccountMenu(user){
 currentUser=user;
 if(!user){
  loginLink.hidden=false;
  accountMenu.hidden=true;
  closeAccountMenu();
  return;
 }
 const displayName=user.displayName||user.email?.split("@")[0]||"Account";
 const initial=displayName.trim().charAt(0).toUpperCase()||"A";
 loginLink.hidden=true;
 accountMenu.hidden=false;
 accountAvatar.textContent=initial;
 accountLabel.textContent=displayName;
 accountName.textContent=displayName;
 accountEmail.textContent=user.email||user.phoneNumber||"Signed-in account";
}

accountTrigger.onclick=()=>{
 const isOpen=!accountDropdown.hidden;
 accountDropdown.hidden=isOpen;
 accountTrigger.setAttribute("aria-expanded",String(!isOpen));
};
document.querySelector("#profileLink").onclick=()=>{
 if(!currentUser) return;
 profileName.textContent=currentUser.displayName||"Not set";
 profileEmail.textContent=currentUser.email||"Not set";
 profilePhone.textContent=currentUser.phoneNumber||"Not set";
 closeAccountMenu();
 profileModal.classList.add("show");
};
document.querySelector("#closeProfile").onclick=()=>profileModal.classList.remove("show");
profileModal.onclick=event=>{if(event.target===profileModal) profileModal.classList.remove("show")};
document.addEventListener("click",event=>{
 if(!accountMenu.contains(event.target)) closeAccountMenu();
});
document.querySelector("#logoutButton").onclick=async()=>{
 if(!isFirebaseConfigured) return;
 try{
  await signOut(getAuth());
  window.location.replace("index.html");
 }catch(error){
  console.error("Unable to sign out",error);
 }
};

if(isFirebaseConfigured){
 const app=initializeApp(firebaseConfig);
 auth=getAuth(app);
 database=getDatabase(app);
 onAuthStateChanged(auth,updateAccountMenu);
}else{
 updateAccountMenu(null);
}

const fallbackProducts=[
{name:"Antminer S19 Pro",type:"asic",tag:"ASIC",spec:"110 TH/s · ~29.5 J/TH",price:"$2,850",note:"Limited allocation"},
{name:"WhatsMiner M30S++",type:"asic",tag:"ASIC",spec:"112 TH/s · ~31 J/TH",price:"$2,650",note:"Batch closing soon"},
{name:"Antminer S21",type:"asic",tag:"NEXT GEN",spec:"200 TH/s · ~17.5 J/TH",price:"$4,950",note:"New release"},
{name:"WhatsMiner M50S",type:"asic",tag:"ASIC",spec:"126 TH/s · Industrial cooling",price:"$3,150",note:"Limited units"},
{name:"GPU Rig — 8× RTX 3080",type:"gpu",tag:"GPU RIG",spec:"≈760 MH/s · Tuned configuration",price:"$4,200",note:"Custom build"},
{name:"GPU Rig — 6× RTX 3070",type:"gpu",tag:"GPU RIG",spec:"≈360 MH/s · Low power",price:"$3,200",note:"Limited units"},
{name:"Kaspa ASIC KS5 Pro",type:"asic",tag:"ASIC",spec:"21 TH/s · KHeavyHash",price:"$6,800",note:"Extremely limited supply"}
];
let products=[...fallbackProducts];

const grid=document.querySelector("#productGrid");
const catalogStatus=document.querySelector("#catalogStatus");
function render(filter="all"){
 grid.innerHTML=products.filter(p=>p.active!==false&&(filter==="all"||p.type===filter)).map((p,i)=>`
 <article class="product-card">
   <span class="tag">${p.tag}</span>
   <h3>${p.name}</h3>
   <div class="spec">${p.spec}</div>
   <div class="product-price">${p.price}</div>
  <div class="payment-label">${p.paymentType === "partial" ? `Partial payment${p.minimumPayment ? ` from ${p.minimumPayment}` : ""}` : "Full payment"}</div>
   <div class="warning">⚠ ${p.note}</div>
   <button class="btn full reserve" data-index="${products.indexOf(p)}">Secure this rig</button>
 </article>`).join("");
 document.querySelectorAll(".reserve").forEach(b=>b.onclick=()=>openModal(products[b.dataset.index]));
}
function setCatalogStatus(message,error=false){
 catalogStatus.textContent=message;
 catalogStatus.classList.toggle("error",error);
}
if(isFirebaseConfigured){
 onValue(ref(database,"products"),snapshot=>{
  const remoteProducts=snapshot.val();
  products=remoteProducts?Object.values(remoteProducts):[...fallbackProducts];
  setCatalogStatus(remoteProducts?"Live catalog":"Live catalog is empty. Showing sample products.");
  render(document.querySelector(".filter.active")?.dataset.filter||"all");
 },error=>{
  console.error("Unable to load products from Realtime Database",error);
  setCatalogStatus("Live catalog unavailable. Showing sample products.",true);
  render();
 });
}else{
 setCatalogStatus("Firebase is not configured. Showing sample products.",true);
 render();
}
document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
 btn.classList.add("active"); render(btn.dataset.filter);
});

const modal=document.querySelector("#orderModal");
let selectedProduct=null;
function openModal(p){
 selectedProduct=p;
 const isPartial=p.paymentType==="partial";
 document.querySelector("#modalTitle").textContent=p.name;
 document.querySelector("#modalPrice").textContent=`Full price: ${p.price}`;
 document.querySelector("#paymentTypeLabel").textContent=`Default option: ${isPartial?"partial payment":"full payment"}. You can choose either option below.`;
 document.querySelector("#fullPayment").checked=!isPartial;
 document.querySelector("#partialPayment").checked=isPartial;
 document.querySelector("#fullPayment").onchange=()=>selectPaymentType("full",p);
 document.querySelector("#partialPayment").onchange=()=>selectPaymentType("partial",p);
 togglePartialAmount(p);
 modal.classList.add("show")
}
function parseMoney(value){const amount=Number(String(value||"").replace(/[^0-9.]/g,""));return Number.isFinite(amount)?amount:0}
function getPaymentType(){return document.querySelector("#partialPayment").checked?"partial":"full"}
function selectPaymentType(type,p){
 document.querySelector("#fullPayment").checked=type==="full";
 document.querySelector("#partialPayment").checked=type==="partial";
 togglePartialAmount(p);
}
function togglePartialAmount(p){
 const isPartial=getPaymentType()==="partial";
 document.querySelector("#partialAmountField").hidden=!isPartial;
 document.querySelector("#paymentAmount").required=isPartial;
 document.querySelector("#paymentAmount").min=String(parseMoney(p.minimumPayment)||1);
 document.querySelector("#paymentAmount").max=String(parseMoney(p.price)||0);
}
document.querySelector("#closeModal").onclick=()=>modal.classList.remove("show");
modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show")};
document.querySelector("#orderForm").onsubmit=async e=>{
 e.preventDefault();
 if(!auth?.currentUser){
  window.location.href=`login.html?redirect=${encodeURIComponent("/index.html")}`;
  return;
 }
 if(!database||!selectedProduct)return;
 const submitButton=e.submitter;
 submitButton.disabled=true;
 try{
  const orderRef=push(ref(database,"orders"));
  const formData=new FormData(e.target);
    const fullAmount=parseMoney(selectedProduct.price);
    const paymentType=getPaymentType();
    const paymentAmount=paymentType==="partial"?Number(formData.get("paymentAmount")):fullAmount;
    const minimumAmount=parseMoney(selectedProduct.minimumPayment)||1;
    if(!Number.isFinite(paymentAmount)||paymentType==="partial"&&(paymentAmount<minimumAmount||paymentAmount>fullAmount)){alert(`Enter an amount between ${minimumAmount} and ${fullAmount}.`);submitButton.disabled=false;return;}
  await set(orderRef,{
   uid:auth.currentUser.uid,
   email:auth.currentUser.email||formData.get("email"),
   customerName:String(formData.get("name")).trim(),
   phone:String(formData.get("phone")||"").trim(),
  physicalAddress:String(formData.get("physicalAddress")).trim(),
   productName:selectedProduct.name,
   productType:selectedProduct.type,
   productSpec:selectedProduct.spec,
  price:`$${paymentAmount.toFixed(2)}`,
  fullPrice:selectedProduct.price,
  paymentType,
   status:"pending_payment",
   createdAt:serverTimestamp()
  });
  window.location.href=`payment.html?orderId=${encodeURIComponent(orderRef.key)}`;
 }catch(error){
  console.error("Unable to save order",error);
  alert("We could not save your order. Please try again.");
  submitButton.disabled=false;
 }
};
document.querySelector("#menuBtn").onclick=()=>{
 const nav=document.querySelector("#navLinks");
 nav.style.display=nav.style.display==="flex"?"none":"flex";
 nav.style.position="absolute";nav.style.top="74px";nav.style.left="0";nav.style.right="0";nav.style.padding="20px";nav.style.background="#090c10";nav.style.flexDirection="column";
};
