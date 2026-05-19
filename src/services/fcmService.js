import { getToken } from "firebase/messaging";
import { messaging } from "../firebase";

// TODO: Replace with your actual Web Push Public Key (VAPID Key) from Firebase Console
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY;

const BACKEND_URL = "https://us-central1-nexridein.cloudfunctions.net/nexrideApi";

export const requestNotificationPermissionAndSubscribe = async () => {
    try {
        console.log("Requesting notification permission...");
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
            console.log("Notification permission granted. Getting FCM token...");
            
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (currentToken) {
                console.log("FCM Token acquired. Subscribing to all_users topic...");
                
                // POST to backend function to map the user token into the global 'all_users' broadcast queue
                const response = await fetch(`${BACKEND_URL}/api/subscribe-topic`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: currentToken,
                        topic: "all_users"
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    console.log("Successfully subscribed to all_users broadcasts!", data);
                    return { success: true, token: currentToken };
                } else {
                    console.error("Backend subscription failed:", data.error);
                    return { success: false, error: data.error };
                }
            } else {
                console.warn("No registration token available. Please ensure FCM service worker runs natively.");
                return { success: false, error: "No token available" };
            }
        } else {
            console.warn("Notification permission was not granted.");
            return { success: false, error: "Permission denied" };
        }
    } catch (error) {
        console.error("Error during FCM setup:", error);
        return { success: false, error: error.message };
    }
};
