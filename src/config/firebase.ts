/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCgLEWEPW-026jLbdeWP9_qL7-G22HIvPI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "a2zee-8c9b1.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "a2zee-8c9b1",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "a2zee-8c9b1.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "880697815093",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "", // You will need to add your Web App ID here
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
