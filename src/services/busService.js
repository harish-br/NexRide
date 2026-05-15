import { db } from '../firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

const normalize = (str) => str ? str.toLowerCase().trim() : "";

/**
 * Service to handle bus schedule operations via Firestore
 */
export const busService = {
    /**
     * Fetches schedules from Firestore for a specific source and destination.
     * Uses search_tags for efficient filtering.
     */
    async getSchedules(source, destination) {
        try {
            if (!source || !destination) return [];

            const schedulesRef = collection(db, "bus_schedules");
            const normSource = source.toLowerCase().trim();
            const normDest = destination.toLowerCase().trim();

            const q = query(
                schedulesRef,
                where("search_tags", "array-contains", normDest),
                limit(100)
            );

            const querySnapshot = await getDocs(q);
            const rawResults = [];
            querySnapshot.forEach((doc) => {
                rawResults.push({ id: doc.id, ...doc.data() });
            });

            console.log(`Firestore Search: Found ${rawResults.length} potential routes for ${normDest}`);

            // Filter locally for source and DIRECTION
            const filteredResults = rawResults.filter(route => {
                const tags = (route.search_tags || []).map(t => t.toLowerCase());
                // Fuzzy match for source
                const sourceMatches = tags.some(tag => tag.includes(normSource) || normSource.includes(tag));
                if (!sourceMatches) return false;

                // Build the full sequence to check direction
                // Sequence: [Source, ...Intermediate, Destination]
                let intermediate = [];
                if (route.route_stops && route.route_stops.length > 0) {
                    intermediate = route.route_stops;
                } else if (route.via) {
                    intermediate = route.via.split(',').map(v => v.trim());
                }

                const sequence = [
                    normalize(route.source),
                    ...intermediate.map(s => normalize(s)),
                    normalize(route.destination)
                ];

                const srcIndex = sequence.indexOf(normSource);
                const destIndex = sequence.indexOf(normDest);

                // Source must exist and come BEFORE Destination
                return srcIndex !== -1 && destIndex !== -1 && srcIndex < destIndex;
            });

            console.log(`Firestore Search: ${filteredResults.length} routes match direction ${normSource} -> ${normDest}`);

            // Format for the UI
            const finalBuses = [];
            filteredResults.forEach(data => {
                data.departure_times.forEach(time => {
                    finalBuses.push({
                        id: `${data.id}-${time}`,
                        from: data.source,
                        to: data.destination,
                        via: (data.via || (data.route_stops ? data.route_stops.join(', ') : '')).replace(/^via\s+/i, ''),
                        operatorName: data.operator || data.operatorName || 'TNSTC',
                        departureTime: this._convertToAmPm(time),
                        serviceType: (data.notes || data.serviceType || "Govt").replace(/^via\s+/i, '')
                    });
                });
            });

            return finalBuses;
        } catch (error) {
            console.error("Error fetching schedules:", error);
            throw error;
        }
    },

    /**
     * Fetches all buses departing from a specific source.
     */
    async getArrivalsBySource(source) {
        try {
            const schedulesRef = collection(db, "bus_schedules");
            const normSource = source.toLowerCase().trim();

            // Fetch everything and filter locally for flexibility
            const q = query(schedulesRef, limit(200));
            const querySnapshot = await getDocs(q);

            const results = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // STRICT SOURCE MATCHING: Only show buses that START their journey from this stop.
                // This prevents passing-through buses from appearing as local departures.
                const isSourceMatch = normalize(data.source) === normSource;

                if (isSourceMatch && data.status !== 'cancelled' && data.status !== 'completed') {
                    data.departure_times.forEach(time => {
                        results.push({
                            id: `${doc.id}-${time}`,
                            from: data.source,
                            to: data.destination,
                            via: (data.via || (data.route_stops ? data.route_stops.join(', ') : '')).replace(/^via\s+/i, ''),
                            operatorName: data.operator || data.operatorName || 'TNSTC',
                            departureTime: this._convertToAmPm(time),
                            serviceType: (data.notes || data.serviceType || "Govt").replace(/^via\s+/i, '')
                        });
                    });
                }
            });

            console.log(`Firestore Arrivals: Found ${results.length} results for ${source}`);
            return results;
        } catch (error) {
            console.error("Error fetching arrivals:", error);
            throw error;
        }
    },

    _convertToAmPm(time24) {
        if (!time24) return "";
        let [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
};
