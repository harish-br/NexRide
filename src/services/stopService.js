import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

class StopService {
    constructor() {
        this.stops = [];
        this.isLoaded = false;
        this.isLoading = false;
    }

    async loadStops() {
        if (this.isLoaded || this.isLoading) return;
        this.isLoading = true;
        
        try {
            const stopsRef = collection(db, "bus_stops");
            const snapshot = await getDocs(stopsRef);
            const loadedStops = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                loadedStops.push({ 
                    id: doc.id, 
                    name: data.name || '',
                    locality: data.locality || data.area || data.district || '',
                    latitude: data.latitude || data.lat || 0,
                    longitude: data.longitude || data.lng || 0,
                    ...data 
                });
            });
            this.stops = loadedStops;
            this.isLoaded = true;
            console.log(`[StopService] Loaded ${loadedStops.length} bus stops from Firebase.`);
        } catch (error) {
            console.error("[StopService] Error loading bus stops:", error);
        } finally {
            this.isLoading = false;
        }
    }

    async searchStops(query) {
        if (!this.isLoaded) {
            await this.loadStops();
        }

        const normalizedQuery = query.toLowerCase().trim();
        if (!normalizedQuery) return [];

        const exactMatches = [];
        const partialMatches = [];

        this.stops.forEach(stop => {
            const name = (stop.name || '').toLowerCase();
            const locality = (stop.locality || '').toLowerCase();

            if (name === normalizedQuery) {
                exactMatches.push(stop);
            } else if (name.includes(normalizedQuery) || locality.includes(normalizedQuery)) {
                partialMatches.push(stop);
            }
        });

        // Exact matches first, then partial matches. Deduplicate by ID if necessary, but here they are mutually exclusive.
        return [...exactMatches, ...partialMatches].slice(0, 10); // Return top 10 results
    }
}

export const stopService = new StopService();
