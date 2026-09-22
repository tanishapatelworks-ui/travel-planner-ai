import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCV0LESBSy-DXlZJHM_ml8GYMmVVgHl2VI",
  authDomain: "travel-planner-ai-c2d89.firebaseapp.com",
  projectId: "travel-planner-ai-c2d89",
  storageBucket: "travel-planner-ai-c2d89.firebasestorage.app",
  messagingSenderId: "658987603210",
  appId: "1:658987603210:web:d4fd19f797c52ac03356f3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);