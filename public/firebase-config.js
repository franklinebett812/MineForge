// Firebase web configuration is safe to expose in client-side code.
// Replace these placeholder values with the config from your Firebase project.
export const firebaseConfig = {
  apiKey: "AIzaSyBiF74n1Y4E_icu_a5dwSgyV1iShX5v4UM",
  authDomain: "mineforge-36496.firebaseapp.com",
  databaseURL: "https://mineforge-36496-default-rtdb.firebaseio.com",
  projectId: "mineforge-36496",
  storageBucket: "mineforge-36496.firebasestorage.app",
  messagingSenderId: "610230129743",
  appId: "1:610230129743:web:ad6b415a3a4810c4e1463a"
};
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => value.includes("YOUR_"));