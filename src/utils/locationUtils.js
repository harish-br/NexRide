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
