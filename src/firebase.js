import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. I've pasted your REAL keys here
const firebaseConfig = {
    apiKey: "AIzaSyCDPqTowIP93Mtth6wcI7D8kc35jtTneVM",
    authDomain: "thrivetrip-18d59.firebaseapp.com",
    projectId: "thrivetrip-18d59",
    storageBucket: "thrivetrip-18d59.firebasestorage.app",
    messagingSenderId: "868831934470",
    appId: "1:868831934470:web:c1f8f94566467ce2a62b87",
    measurementId: "G-E02671EEVK"
};
console.log("CHECKING KEY:", firebaseConfig.apiKey);
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 2. These exports make Auth and Database available to the rest of your app
export const auth = getAuth(app);
export const db = getFirestore(app);