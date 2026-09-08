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
