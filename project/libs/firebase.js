// libs/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEspD5OBbpGHSc6H-tRcoBpAJwxlILt-U",
  authDomain: "stulogger.firebaseapp.com",
  projectId: "stulogger",
  storageBucket: "stulogger.firebasestorage.app",
  messagingSenderId: "16926547505",
  appId: "1:16926547505:web:2330edc2a69dec9443ff10",
  measurementId: "G-SP06770QCQ",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export default auth;
