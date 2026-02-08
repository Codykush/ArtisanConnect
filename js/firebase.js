// firebase.js - COMPLETE FIXED VERSION
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs,
    doc,
    getDoc,
    addDoc,                    // ✅ ADD THIS
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { 
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { 
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js";

// ✅ YOUR FIREBASE PROJECT CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBLEppI5BvI-8zBzQ-OCDjE8N5nhmpuP6E",
    authDomain: "artisanconnect-5fff7.firebaseapp.com",
    projectId: "artisanconnect-5fff7",
    storageBucket: "artisanconnect-5fff7.firebasestorage.app",
    messagingSenderId: "1041150969303",
    appId: "1:1041150969303:web:30c8756d068f7a196c3792",
    measurementId: "G-PW96DZ42D2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// Export everything
export { 
    // Core Firebase services
    app,
    db, 
    auth,
    storage,
    googleProvider,
    
    // Firestore functions - ✅ MAKE SURE ALL ARE INCLUDED
    collection, 
    getDocs,
    doc,
    getDoc,
    addDoc,                    // ✅ THIS WAS MISSING
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    
    // Auth functions
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    signInWithPopup,
    sendEmailVerification,
    sendPasswordResetEmail,
    
    // Storage functions
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};