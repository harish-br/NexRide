import { messaging } from "../firebase";
import { getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { auth } from "../firebase";

const db = getFirestore();

// VAPID Key from Firebase Console (Settings > Cloud Messaging > Web Push certificates)
// NOTE: Ideally this should be in .env, but for now we put a placeholder or explicit key if known.
// Since the user didn't provide one, we'll try without it (some setups work) or ask the user.
// Usually getToken({ vapidKey: '...' })
const VAPID_KEY = "BKC_9vL8pC ..."; // TODO: Ask User for VAPID Key or use default

export const notificationService = {
    // Check if supported
    isSupported: () => 'Notification' in window,

    // Request Permission
    requestPermission: async () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return 'unsupported';
        }

        try {
            const permission = await Notification.requestPermission();
            return permission; // 'granted', 'denied', or 'default'
        } catch (error) {
            console.error('Error requesting permission:', error);
            return 'error';
        }
    },

    // Get Token and Save to Firestore
    registerForPushNotifications: async () => {
        try {
            if (!auth.currentUser) return null;
            if (!messaging) {
                console.warn("Firebase Messaging not initialized. Skipping token registration.");
                return null;
            }

            const token = await getToken(messaging, {
                // vapidKey: VAPID_KEY // Optional if using default instance
            });

            if (token) {
                console.log('FCM Token:', token);
                await notificationService.saveTokenToDatabase(token);
                return token;
            } else {
                console.log('No registration token available. Request permission to generate one.');
                return null;
            }
        } catch (err) {
            console.log('An error occurred while retrieving token. ', err);
            return null;
        }
    },

    // Save Token
    saveTokenToDatabase: async (token) => {
        if (!auth.currentUser) return;
        const userRef = doc(db, "users", auth.currentUser.uid);
        // Use setDoc with merge: true to create if not exists
        await setDoc(userRef, {
            fcmTokens: arrayUnion(token),
            notificationsEnabled: true,
            lastUpdated: new Date()
        }, { merge: true });
    },

    // Remove Token (Logout)
    unregisterFromPushNotifications: async (token) => {
        if (!auth.currentUser || !token) return;
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, {
            fcmTokens: arrayRemove(token)
        });
    },

    // Foreground Listener
    // Foreground Listener
    listenForMessages: (callback) => {
        if (!messaging) {
            console.warn("Firebase Messaging not ready (or not supported) -> skipping listener");
            return () => { }; // No-op unsubscribe
        }
        try {
            return onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                callback(payload);
            });
        } catch (err) {
            console.warn("Failed to subscribe to messages:", err);
            return () => { };
        }
    }
};
