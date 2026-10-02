import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBY358TeHyaswRfEHRy3B7_bBBkgbyapRE",
    authDomain: "sneakershop-9147c.firebaseapp.com",
    projectId: "sneakershop-9147c",
    storageBucket: "sneakershop-9147c.firebasestorage.app",
    messagingSenderId: "241586277681",
    appId: "1:241586277681:web:61169099fa4ab83449b410",
    measurementId: "G-LTHGGT1516"
};

export const firebaseReady = !firebaseConfig.apiKey.startsWith("YOUR_");
export const app = firebaseReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;