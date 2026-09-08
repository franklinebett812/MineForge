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
7. Create a Realtime Database and verify its URL in `firebase-config.js`.
8. Add the database rules below. Any authenticated user can change products with this unrestricted setup.

Recommended Firebase functions:
- signInWithEmailAndPassword()
- signInWithPopup() + GoogleAuthProvider
- signInWithPhoneNumber() + RecaptchaVerifier
- sendPasswordResetEmail()
- createUserWithEmailAndPassword()

The browser config is intentionally public. Never add service-account credentials or private server keys to `firebase-config.js`.

Never place private server credentials or service-account keys in the browser.

## Realtime Database rules

Use these rules in Firebase Console → Realtime Database → Rules:

```json
{
   "rules": {
      "products": {
         ".read": true,
         ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'"
      },
      "users": {
         ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'",
         "$uid": {
            ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
            ".write": "auth != null && (root.child('users').child(auth.uid).child('role').val() == 'admin' || (auth.uid == $uid && ((!data.exists() && !newData.child('role').exists()) || (data.exists() && newData.child('role').val() == data.child('role').val())))"
         }
      },
      "orders": {
         ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'",
         "$orderId": {
            ".read": "auth != null && (data.child('uid').val() == auth.uid || root.child('users').child(auth.uid).child('role').val() == 'admin')",
            ".write": "auth != null && ((!data.exists() && newData.child('uid').val() == auth.uid) || data.child('uid').val() == auth.uid)"
         }
      }
   }
}
```

The dashboard checks `users/{uid}/role` and requires the value `admin`. Set that role from the Firebase Console Realtime Database data editor or a trusted server. Do not allow browser users to write their own role.

### Optional production hardening

For stronger authorization, replace the database role check with a custom claim. Assign it from a trusted Admin SDK script:

```js
const admin = require("firebase-admin");
const serviceAccount = require("./service-account-key.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

(async () => {
   const uid = "USER_UID";
   const user = await admin.auth().getUser(uid);
   await admin.auth().setCustomUserClaims(uid, {
      ...(user.customClaims || {}),
      admin: true
   });
   console.log(`Admin claim assigned to ${user.email || uid}`);
})();
```

Install the Admin SDK with `npm install firebase-admin`, download the service-account key from Project settings → Service accounts, and keep that key outside this browser project. Run the script on a trusted machine only.

After assigning the claim, sign out and sign in again so Firebase refreshes the user's ID token.
