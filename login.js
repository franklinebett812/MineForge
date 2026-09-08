import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
	browserLocalPersistence,
	browserSessionPersistence,
	createUserWithEmailAndPassword,
	getAuth,
	GoogleAuthProvider,
	RecaptchaVerifier,
	sendPasswordResetEmail,
	setPersistence,
	signInWithEmailAndPassword,
	signInWithPhoneNumber,
	signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

const $ = selector => document.querySelector(selector);
const status = $("#authStatus");
let confirmationResult;
let recaptchaVerifier;

function showStatus(message, type = "") {
	status.textContent = message;
	status.className = `status ${type}`;
}

function firebaseError(error) {
	const messages = {
		"auth/invalid-credential": "The email or password is incorrect.",
		"auth/email-already-in-use": "An account already exists for this email.",
		"auth/invalid-email": "Enter a valid email address.",
		"auth/weak-password": "Choose a stronger password.",
		"auth/popup-closed-by-user": "The Google sign-in window was closed.",
		"auth/too-many-requests": "Too many attempts. Try again later.",
		"auth/invalid-verification-code": "That SMS code is invalid.",
		"auth/code-expired": "That SMS code has expired. Request a new one."
	};
	return messages[error.code] || "Authentication failed. Check your details and try again.";
}

function redirectAfterSignIn(user) {
	showStatus(`Signed in as ${user.email || user.phoneNumber}.`, "success");
	setTimeout(() => { window.location.href = "index.html"; }, 700);
}

if (isFirebaseConfigured) {
	const app = initializeApp(firebaseConfig);
	const auth = getAuth(app);

	$("#emailForm").addEventListener("submit", async event => {
		event.preventDefault();
		try {
			const persistence = $("#remember").checked ? browserLocalPersistence : browserSessionPersistence;
			await setPersistence(auth, persistence);
			const credential = await signInWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
			redirectAfterSignIn(credential.user);
		} catch (error) {
			showStatus(firebaseError(error), "error");
		}
	});

	$("#googleBtn").addEventListener("click", async () => {
		try {
			const credential = await signInWithPopup(auth, new GoogleAuthProvider());
			redirectAfterSignIn(credential.user);
		} catch (error) {
			showStatus(firebaseError(error), "error");
		}
	});

	$("#forgot").addEventListener("click", async event => {
		event.preventDefault();
		const email = $("#email").value.trim();
		if (!email) {
			showStatus("Enter your email address first.", "error");
			$("#email").focus();
			return;
		}
		try {
			await sendPasswordResetEmail(auth, email);
			showStatus("Password reset email sent.", "success");
		} catch (error) {
			showStatus(firebaseError(error), "error");
		}
	});

	$("#signup").addEventListener("click", async event => {
		event.preventDefault();
		try {
			const credential = await createUserWithEmailAndPassword(auth, $("#email").value.trim(), $("#password").value);
			redirectAfterSignIn(credential.user);
		} catch (error) {
			showStatus(firebaseError(error), "error");
		}
	});

	$("#phoneForm").addEventListener("submit", async event => {
		event.preventDefault();
		const phone = $("#countryCode").value + $("#phone").value.trim();
		if ($("#phone").value.trim().length < 5) {
			showStatus("Enter a valid phone number.", "error");
			return;
		}
		try {
			if (!recaptchaVerifier) {
				recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
			}
			confirmationResult = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
			$("#verificationSection").hidden = false;
			showStatus("Verification code sent by SMS.", "success");
		} catch (error) {
			recaptchaVerifier?.clear();
			recaptchaVerifier = null;
			showStatus(firebaseError(error), "error");
		}
	});

	$("#verifyPhone").addEventListener("click", async () => {
		if (!confirmationResult) return;
		try {
			const credential = await confirmationResult.confirm($("#verificationCode").value.trim());
			redirectAfterSignIn(credential.user);
		} catch (error) {
			showStatus(firebaseError(error), "error");
		}
	});
} else {
	["#emailForm", "#phoneForm", "#googleBtn", "#forgot", "#signup"].forEach(selector => {
		$(selector).addEventListener("click", event => {
			event.preventDefault();
			showStatus("Add your Firebase web configuration in firebase-config.js first.", "error");
		});
	});
}

$("#togglePassword").addEventListener("click", () => {
	const input = $("#password");
	const show = input.type === "password";
	input.type = show ? "text" : "password";
	$("#togglePassword").textContent = show ? "Hide" : "Show";
});
