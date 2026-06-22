import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA8e3lUkkoyfp42HIwxLX9IgKGqmOacxl0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "just-us-53056.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "just-us-53056",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "just-us-53056.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "247025722834",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:247025722834:web:e534ff23c1d58e05cd140b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.error('Firebase messaging not supported:', err);
}

export { app, messaging, getToken, onMessage };
