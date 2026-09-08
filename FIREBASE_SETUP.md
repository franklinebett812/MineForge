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
4. Add Firebase's Web SDK to `login.html`.
5. Replace the demo handlers in `login.js` with Firebase Auth calls.

Recommended Firebase functions:
- signInWithEmailAndPassword()
- signInWithPopup() + GoogleAuthProvider
- signInWithPhoneNumber() + RecaptchaVerifier
- sendPasswordResetEmail()
- createUserWithEmailAndPassword()

Never place private server credentials or service-account keys in the browser.
