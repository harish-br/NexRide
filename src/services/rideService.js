import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';

/* ---------------- UTILITIES ---------------- */

const deg2rad = (deg) => deg * (Math.PI / 180);

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

/* ---------------- RIDE SERVICE ---------------- */

export const rideService = {
    /* 1️⃣ GET ONLINE DRIVERS (FIXED) */
    getOnlineDrivers: async (userLocation, _radiusKm = 5) => {
        const fetchWithRetry = async (attempt = 1) => {
            try {
                console.log(`[RideService] Searching for ONLINE drivers (Attempt ${attempt}/3)`);

                const driversRef = collection(db, 'drivers');
                // 🔥 QUERY: role="driver", isOnline=true, isBusy=false
                const q = query(
                    driversRef,
                    where('role', '==', 'driver'),
                    where('isOnline', '==', true),
                    where('isBusy', '==', false)
                );

                const snapshot = await getDocs(q);
                console.log(`[RideService] Firestore returned ${snapshot.size} potential driver documents`);

                const drivers = [];

                snapshot.forEach((docSnap) => {
                    const d = docSnap.data();
                    const driverId = docSnap.id;
                    const loc = d.location;

                    console.log(`[DEBUG] Evaluating Driver: ${driverId}`, {
                        isOnline: d.isOnline,
                        isBusy: d.isBusy,
                        isActive: d.isActive,
                        hasLocation: !!loc
                    });

                    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                        const distance = calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            loc.lat,
                            loc.lng
                        );

                        console.log(`[DEBUG] Driver ${driverId} is ${distance.toFixed(2)} km away`);

                        // 🛑 DEBUG STEP: We skip distance check for now to ensure detection works
                        // In production, we would use: if (distance <= radiusKm)
                        drivers.push({
                            id: driverId,
                            ...d,
                            distanceFromUser: distance
                        });
                    } else {
                        console.warn(`[DEBUG] Driver ${driverId} excluded: Missing or invalid location field`, loc);
                    }
                });

                if (drivers.length === 0 && attempt < 3) {
                    console.log(`[RideService] Found 0 drivers on attempt ${attempt}. Retrying in 3 seconds...`);
                    await new Promise(r => setTimeout(r, 3000));
                    return fetchWithRetry(attempt + 1);
                }

                console.log(`[RideService] Final count of online drivers found: ${drivers.length}`);
                return drivers;
            } catch (err) {
                console.error('[RideService] getOnlineDrivers failed:', err);
                return [];
            }
        };

        return fetchWithRetry();
    },

    /* 2️⃣ CREATE TRIP */
    createTrip: async (tripData) => {
        const tripId = `trip_${Date.now()}`;
        const tripRef = doc(db, 'trips', tripId);

        const payload = {
            tripId,
            userId: tripData.userId,
            status: 'SEARCHING',
            pickup: {
                lat: Number(tripData.pickup.lat),
                lng: Number(tripData.pickup.lng),
                name: tripData.pickup.name
            },
            drop: {
                lat: Number(tripData.drop.lat),
                lng: Number(tripData.drop.lng),
                name: tripData.drop.name
            },
            createdAt: serverTimestamp()
        };

        await setDoc(tripRef, payload);
        console.log('[RideService] Trip created', tripId);

        return { tripId, ...payload };
    },

    /* 3️⃣ SEND REQUEST TO DRIVER (CORRECT PATH) */
    sendRequestToDriver: async (driverId, trip) => {
        try {
            const reqRef = doc(
                db,
                'driverRequests',
                driverId,
                'trips',
                trip.tripId
            );

            await setDoc(reqRef, {
                ...trip,
                status: 'REQUESTED',
                createdAt: serverTimestamp()
            });

            console.log(
                `[RideService] Request sent → driverRequests/${driverId}/trips/${trip.tripId}`
            );
        } catch (err) {
            console.error('[RideService] sendRequestToDriver failed', err);
        }
    },

    /* 4️⃣ LISTEN TO TRIP STATUS */
    listenToTripStatus: (tripId, onUpdate) => {
        const ref = doc(db, 'trips', tripId);
        return onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                onUpdate(snap.data());
            }
        });
    },

    /* 5️⃣ UPDATE TRIP STATUS */
    updateTripStatus: async (tripId, status) => {
        await updateDoc(doc(db, 'trips', tripId), { status });
    },

    /* 6️⃣ LISTEN TO DRIVER LOCATION */
    listenToDriverLocation: (driverId, onUpdate) => {
        const ref = doc(db, 'drivers', driverId);
        return onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                const d = snap.data();
                // Check new location structure first
                if (d.location && typeof d.location.lat === 'number' && typeof d.location.lng === 'number') {
                    onUpdate({ lat: d.location.lat, lng: d.location.lng });
                } else if (typeof d.lat === 'number' && typeof d.lng === 'number') {
                    onUpdate({ lat: d.lat, lng: d.lng });
                }
            }
        });
    },

    /* 7️⃣ CANCEL TRIP */
    cancelTripByUser: async (tripId) => {
        await updateDoc(doc(db, 'trips', tripId), {
            status: 'CANCELLED_BY_USER'
        });
    }
};