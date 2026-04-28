import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDtR8_mOrvsDm-5LfpAQfqkQpJoRZjwSbQ",
  authDomain: "onlinebanking-47d54.firebaseapp.com",
  projectId: "onlinebanking-47d54",
  storageBucket: "onlinebanking-47d54.firebasestorage.app",
  messagingSenderId: "132970681810",
  appId: "1:132970681810:web:4e5d1b70d82a84ed70240b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need
export const auth = getAuth(app);
export const db = getFirestore(app);