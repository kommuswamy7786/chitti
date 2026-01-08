import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, getDocs, query, where, onSnapshot, serverTimestamp, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC2XaZBirEm3Wtb-ia06ufWcfXbbCYrjFc",
  authDomain: "chitti-app-f1077.firebaseapp.com",
  projectId: "chitti-app-f1077",
  storageBucket: "chitti-app-f1077.firebasestorage.app",
  messagingSenderId: "840078870584",
  appId: "1:840078870584:web:fbc5bc08cc246b93a57ecd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.log('Browser not supported');
  }
});

export { collection, addDoc, updateDoc, doc, getDocs, query, where, onSnapshot, serverTimestamp, getDoc, setDoc, deleteDoc, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword };
