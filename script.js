import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const loginLink=document.querySelector("#loginLink");
const accountMenu=document.querySelector("#accountMenu");
const accountTrigger=document.querySelector("#accountTrigger");
const accountDropdown=document.querySelector("#accountDropdown");
const accountAvatar=document.querySelector("#accountAvatar");
const accountLabel=document.querySelector("#accountLabel");
const accountName=document.querySelector("#accountName");
const accountEmail=document.querySelector("#accountEmail");

function closeAccountMenu(){
 accountDropdown.hidden=true;
 accountTrigger.setAttribute("aria-expanded","false");
}

function updateAccountMenu(user){
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
 const auth=getAuth(app);
 onAuthStateChanged(auth,updateAccountMenu);
}else{
 updateAccountMenu(null);
}

const products=[
{name:"Antminer S19 Pro",type:"asic",tag:"ASIC",spec:"110 TH/s · ~29.5 J/TH",price:"$2,850",note:"Limited allocation"},
{name:"WhatsMiner M30S++",type:"asic",tag:"ASIC",spec:"112 TH/s · ~31 J/TH",price:"$2,650",note:"Batch closing soon"},
{name:"Antminer S21",type:"asic",tag:"NEXT GEN",spec:"200 TH/s · ~17.5 J/TH",price:"$4,950",note:"New release"},
{name:"WhatsMiner M50S",type:"asic",tag:"ASIC",spec:"126 TH/s · Industrial cooling",price:"$3,150",note:"Limited units"},
{name:"GPU Rig — 8× RTX 3080",type:"gpu",tag:"GPU RIG",spec:"≈760 MH/s · Tuned configuration",price:"$4,200",note:"Custom build"},
{name:"GPU Rig — 6× RTX 3070",type:"gpu",tag:"GPU RIG",spec:"≈360 MH/s · Low power",price:"$3,200",note:"Limited units"},
{name:"Kaspa ASIC KS5 Pro",type:"asic",tag:"ASIC",spec:"21 TH/s · KHeavyHash",price:"$6,800",note:"Extremely limited supply"}
];

const grid=document.querySelector("#productGrid");
function render(filter="all"){
 grid.innerHTML=products.filter(p=>filter==="all"||p.type===filter).map((p,i)=>`
 <article class="product-card">
   <span class="tag">${p.tag}</span>
   <h3>${p.name}</h3>
   <div class="spec">${p.spec}</div>
   <div class="product-price">${p.price}</div>
   <div class="warning">⚠ ${p.note}</div>
   <button class="btn full reserve" data-index="${products.indexOf(p)}">Secure this rig</button>
 </article>`).join("");
 document.querySelectorAll(".reserve").forEach(b=>b.onclick=()=>openModal(products[b.dataset.index]));
}
render();
document.querySelectorAll(".filter").forEach(btn=>btn.onclick=()=>{
 document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));
 btn.classList.add("active"); render(btn.dataset.filter);
});

const modal=document.querySelector("#orderModal");
function openModal(p){document.querySelector("#modalTitle").textContent=p.name;document.querySelector("#modalPrice").textContent=`Listed price: ${p.price}`;modal.classList.add("show")}
document.querySelector("#closeModal").onclick=()=>modal.classList.remove("show");
modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show")};
document.querySelector("#orderForm").onsubmit=e=>{
 e.preventDefault(); alert("Demo request submitted. Connect this form to your backend before using it in production."); modal.classList.remove("show"); e.target.reset();
};
document.querySelector("#menuBtn").onclick=()=>{
 const nav=document.querySelector("#navLinks");
 nav.style.display=nav.style.display==="flex"?"none":"flex";
 nav.style.position="absolute";nav.style.top="74px";nav.style.left="0";nav.style.right="0";nav.style.padding="20px";nav.style.background="#090c10";nav.style.flexDirection="column";
};
