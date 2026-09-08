// Firebase web configuration is safe to expose in client-side code.
// Replace these placeholder values with the config from your Firebase project.
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => value.includes("YOUR_"));