// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
import { getApps, getApp } from "firebase/app";
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize App Check (Safe Mode)
try {
    // Only run if localhost or https (App Check often requires valid domain)
    if (location.hostname === 'localhost' || location.protocol === 'https:') {
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_V3_KEY),
            isTokenAutoRefreshEnabled: true,
        });
    }
} catch (e) {
    console.warn("Firebase App Check failed to initialize:", e);
}

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
// Set persistence to local (default, but explicit as requested)
setPersistence(auth, browserLocalPersistence);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: "select_account"
});

const githubProvider = new GithubAuthProvider();

// Initialize Cloud Messaging (Safe Mode) - Requires HTTPS or Localhost
import { getMessaging, isSupported } from "firebase/messaging";

let messaging = null;
if (typeof window !== "undefined") {
    isSupported().then((supported) => {
        if (supported) {
            messaging = getMessaging(app);
        }
    }).catch(e => console.warn("Firebase Messaging not supported:", e));
}

export { app, analytics, auth, googleProvider, githubProvider, messaging, db };
