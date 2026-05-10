// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAps5ODxH7QHYb02EKTT1i0Bal8n3oc2DI",
  authDomain: "flipflash-62c04.firebaseapp.com",
  projectId: "flipflash-62c04",
  storageBucket: "flipflash-62c04.firebasestorage.app",
  messagingSenderId: "681221594095",
  appId: "1:681221594095:web:714939eab1b9f136f8b41a",
  measurementId: "G-S7T3E2N087"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Khởi tạo services
const db = firebase.firestore();
const auth = firebase.auth();

// Export để dùng ở file khác
window.db = db;
window.auth = auth;

console.log("Firebase connected!");