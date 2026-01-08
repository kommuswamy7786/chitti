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

// Wait for Firebase SDK to load
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.log('Waiting for Firebase SDK to load...');
        setTimeout(initializeFirebase, 100);
        return;
    }

    console.log('Firebase SDK loaded, initializing...');
    
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);

        // Initialize Firestore
        window.db = firebase.firestore();
        window.auth = firebase.auth();

        // Enable offline persistence
        window.db.enablePersistence().catch((err) => {
            if (err.code == 'failed-precondition') {
                console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
            } else if (err.code == 'unimplemented') {
                console.log('The current browser does not support all of the features required to enable persistence');
            }
        });
        
        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }
}

// Start initialization when script loads
initializeFirebase();
