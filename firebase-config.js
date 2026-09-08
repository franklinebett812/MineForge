// Firebase web configuration is safe to expose in client-side code.
// Replace these placeholder values with the config from your Firebase project.
export const firebaseConfig = {
  apiKey: "AIzaSyAKyDCD2XBAT8R1PIB4RkdI5PCfnjiV7BA",
  authDomain: "mineforge-563c9.firebaseapp.com",
  projectId: "mineforge-563c9",
  storageBucket: "mineforge-563c9.firebasestorage.app",
  messagingSenderId: "549655456072",
  appId: "1:549655456072:web:3dd1d55e4f6644b56f2b7d",
  measurementId: "G-LRE1EK3EDT",
  databaseURL: "https://mineforge-563c9-default-rtdb.firebaseio.com"
};
export const isFirebaseConfigured = !Object.values(firebaseConfig).some(value => value.includes("YOUR_"));