import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch() {
    console.log("Adding a test bus schedule to Erode...");
    try {
        const docRef = await addDoc(collection(db, "bus_schedules"), {
            source: "Erode",
            destination: "Coimbatore",
            departure_times: ["08:00", "09:00", "10:00", "14:30"],
            status: "active",
            operator: "TNSTC",
            serviceType: "Govt",
            via: "Perundurai, Avinashi",
            search_tags: ["erode", "coimbatore", "perundurai", "avinashi"]
        });
        console.log("Document written with ID: ", docRef.id);
        
        console.log("Fetching bus_schedules...");
        const querySnapshot = await getDocs(collection(db, "bus_schedules"));
        const schedules = [];
        querySnapshot.forEach((doc) => {
            schedules.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Found ${schedules.length} schedules`);
    } catch (e) {
        console.error("Error:", e);
    }
}

testFetch();
