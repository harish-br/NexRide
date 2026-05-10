export const ERODE_BUS_STAND_COORDS = {
    lat: 11.3410,
    lng: 77.7172
};

// Radius in meters (30 km)
export const VISIBILITY_RADIUS_METERS = 30000;

// Erode District Centroid (Approximate)
// Using coordinates closer to central Erode district to cover 50km radius effectively
export const ERODE_DISTRICT_CENTROID = {
    lat: 11.3410, // Using Bus Stand as a reliable central point for the district radius fallback
    lng: 77.7172
};

// Anthiyur Coordinates
export const ANTHIYUR_COORDS = {
    lat: 11.5833,
    lng: 77.6000
};

// Source Bus Stands Coordinates Map
export const SOURCE_COORDINATES = {
    "Erode": { lat: 11.3410, lng: 77.7172, district: "Erode" },
    "Anthiyur": { lat: 11.5833, lng: 77.6000, district: "Erode" },
    "Ooty": { lat: 11.4102, lng: 76.6991, district: "Nilgiris" },
    "Coonoor": { lat: 11.3530, lng: 76.7959, district: "Nilgiris" },
    "Mettupalayam": { lat: 11.3008, lng: 76.9405, district: "Coimbatore" },
    "Coimbatore": { lat: 11.0168, lng: 76.9558, district: "Coimbatore" },
    "Chennai": { lat: 13.0827, lng: 80.2707, district: "Chennai" },
    "Salem": { lat: 11.6643, lng: 78.1460, district: "Salem" },
    "Tiruppur": { lat: 11.1085, lng: 77.3411, district: "Tiruppur" },
    "Palani": { lat: 10.4492, lng: 77.5271, district: "Dindigul" },
    "Dharapuram": { lat: 10.7289, lng: 77.5195, district: "Tiruppur" },
    "Kangayam": { lat: 11.0044, lng: 77.5645, district: "Tiruppur" },
    "Sathyamangalam": { lat: 11.5034, lng: 77.2444, district: "Erode" },
    "Gobichettipalayam": { lat: 11.4533, lng: 77.4377, district: "Erode" },
    "Bhavani": { lat: 11.4485, lng: 77.6836, district: "Erode" },
    "Gudalur": { lat: 11.5034, lng: 76.4914, district: "Nilgiris" }
};

// District Fallback Radius (50 km)
export const DISTRICT_FALLBACK_RADIUS_METERS = 50000;

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in meters
 */
export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};
