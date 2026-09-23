// libs/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCNZ4zYlWy04RUqxBgJ1yP2o7kjKvYO9rk",
  authDomain: "progova-2b80c.firebaseapp.com",
  projectId: "progova-2b80c",
  storageBucket: "progova-2b80c.firebasestorage.app",
  messagingSenderId: "835557495201",
  appId: "1:835557495201:web:923c02720aed778f67bbe0",
  measurementId: "G-HDPLTERG8S",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };