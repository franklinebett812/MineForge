const $=s=>document.querySelector(s);

$("#togglePassword").onclick=()=>{
 const input=$("#password");
 const show=input.type==="password";
 input.type=show?"text":"password";
 $("#togglePassword").textContent=show?"Hide":"Show";
};

$("#googleBtn").onclick=()=>{
 alert("Google Sign-In is ready for Firebase integration. Add your Firebase configuration and enable Google Authentication.");
};

$("#emailForm").onsubmit=e=>{
 e.preventDefault();
 const email=$("#email").value.trim();
 alert(`Demo sign-in submitted for ${email}. Connect Firebase Authentication to authenticate users.`);
};

$("#phoneForm").onsubmit=e=>{
 e.preventDefault();
 const phone=$("#countryCode").value+$("#phone").value.trim();
 if($("#phone").value.trim().length<5){alert("Please enter a valid phone number.");return;}
 alert(`Demo phone sign-in requested for ${phone}. Connect Firebase Phone Authentication to send the SMS code.`);
};

$("#forgot").onclick=e=>{
 e.preventDefault();
 alert("Password reset UI is ready. Connect Firebase sendPasswordResetEmail() for the real flow.");
};

$("#signup").onclick=e=>{
 e.preventDefault();
 alert("Create-account flow can be connected to Firebase email/password registration.");
};
