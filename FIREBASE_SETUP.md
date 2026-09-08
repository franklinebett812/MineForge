# Firebase Authentication setup

The login page is already structured for:
- Email/password
- Google
- Phone/SMS

To make authentication real:

1. Create/open a Firebase project.
2. In Firebase Console → Authentication → Sign-in method, enable:
   - Email/Password
   - Google
   - Phone
3. Add your web app and copy its Firebase configuration.
4. Copy the Firebase web app configuration into `firebase-config.js`.
5. Serve the project from `http://localhost` (for example with VS Code Live Server). Firebase modules do not reliably load from `file://` pages.
6. Add `localhost` and your production domain under Authentication → Settings → Authorized domains.

Recommended Firebase functions:
- signInWithEmailAndPassword()
- signInWithPopup() + GoogleAuthProvider
- signInWithPhoneNumber() + RecaptchaVerifier
- sendPasswordResetEmail()
- createUserWithEmailAndPassword()

The browser config is intentionally public. Never add service-account credentials or private server keys to `firebase-config.js`.

Never place private server credentials or service-account keys in the browser.
