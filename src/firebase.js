// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDjPVWScFkEeM1Ry-21G3KwW_sVhK1D1NI",
  authDomain: "afeefa-a-life-remembered.firebaseapp.com",
  projectId: "afeefa-a-life-remembered",
  storageBucket: "afeefa-a-life-remembered.firebasestorage.app",
  messagingSenderId: "730798946822",
  appId: "1:730798946822:web:7515b1fc80f3e9f735a187",
  measurementId: "G-FQS20CQQ5E"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
