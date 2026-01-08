// Firebase Configuration
// Replace with YOUR Firebase config from console.firebase.google.com

const firebaseConfig = {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  apiKey: "AIzaSyBq_TRYaQA1vFq0UZ4W3qPTDfGKEo2bcVA",
  authDomain: "chitti--api.firebaseapp.com",
  projectId: "chitti--api",
  storageBucket: "chitti--api.firebasestorage.app",
  messagingSenderId: "775657463954",
  appId: "1:775657463954:web:3d1b90615ad4281b9e864b",
  measurementId: "G-YW86ZB1CWX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence
db.enablePersistence().catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
        console.log('The current browser does not support all of the features required to enable persistence');
    }
});
