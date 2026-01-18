// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAMMIk5F9A4xlYxP9geIeYZBbEQplWpPiE",
  authDomain: "porto-3e98c.firebaseapp.com",
  projectId: "porto-3e98c",
  storageBucket: "porto-3e98c.firebasestorage.app",
  messagingSenderId: "718954562168",
  appId: "1:718954562168:web:588114e4eecd029b37e38d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);