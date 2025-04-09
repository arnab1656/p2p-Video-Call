import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { firebaseConfig } from "../../config/firebaseConfig";

export const firebaseConfig = {
  apiKey: "AIzaSyDibbebVpp9GeVu8MPilWAyBRw6g8nN_RQ",
  authDomain: "p2p-app-bd5ee.firebaseapp.com",
  projectId: "p2p-app-bd5ee",
  storageBucket: "p2p-app-bd5ee.firebasestorage.app",
  messagingSenderId: "935467548973",
  appId: "1:935467548973:web:0225bc55e0aa0c7e45d3a4",
  measurementId: "G-V8YGD19QM6",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
