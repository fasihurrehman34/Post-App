import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRejfiQqsosfLGWQD6SMRUbBt_-W_Zp7M",
    authDomain: "abdullah-38ca9.firebaseapp.com",
    projectId: "abdullah-38ca9",
    storageBucket: "abdullah-38ca9.firebasestorage.app",
    messagingSenderId: "1022411842219",
    appId: "1:1022411842219:web:74bc561e07e18639900dee",
    measurementId: "G-L1Z59PR8TT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();