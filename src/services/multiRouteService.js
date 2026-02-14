import { busStops, busSchedules } from '../data/busSchedules';
import { TRAIN_STATIONS } from '../data/trainStations';

// Helper: Haversine distance
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

export const generateMultiRoutes = (source, destination) => {
    if (!source || !destination) return [];

    const srcLat = source.lat;
    const srcLng = source.lng;
    const destLat = destination.lat;
    const destLng = destination.lng;

    // STEP 1: Identify nearest stops for source and destination
    const allStops = [
        ...busStops.map(s => ({ ...s, type: 'BUS' })),
        ...TRAIN_STATIONS.map(s => ({ ...s, type: 'TRAIN' }))
    ];

    const srcStops = allStops
        .map(stop => ({
            ...stop,
            dist: calculateDistance(srcLat, srcLng, stop.lat, stop.lng)
        }))
        .filter(s => s.dist < 5000) // Within 5km walk/auto
        .sort((a, b) => a.dist - b.dist);

    const destStops = allStops
        .map(stop => ({
            ...stop,
            dist: calculateDistance(destLat, destLng, stop.lat, stop.lng)
        }))
        .filter(s => s.dist < 5000)
        .sort((a, b) => a.dist - b.dist);

    if (srcStops.length === 0 || destStops.length === 0) {
        // Fallback: Just walking
        const directDist = calculateDistance(srcLat, srcLng, destLat, destLng);
        return [{
            routeId: 'walk-only',
            label: 'EARLIEST',
            totalDistanceKm: (directDist / 1000).toFixed(1),
            totalFare: 0,
            startInMinutes: 0,
            steps: [{
                type: 'WALK',
                distanceMeters: Math.round(directDist),
                instruction: `Walk ${(directDist / 1000).toFixed(1)} km to destination`
            }]
        }];
    }

    // STEP 2: Find valid transport links
    const routes = [];

    // Attempt to find 1-3 distinct paths
    // Path A: Closest stop at both ends
    const pathA = findDirectLink(srcStops[0], destStops[0]);
    if (pathA) routes.push(pathA);

    // Path B: Alternative stop (e.g., if closest is bus, try train if available)
    const alternateSrc = srcStops.find(s => s.type !== srcStops[0].type) || srcStops[1];
    if (alternateSrc) {
        const pathB = findDirectLink(alternateSrc, destStops[0]);
        if (pathB && pathB.routeId !== pathA?.routeId) routes.push(pathB);
    }

    // Path C: Long distance / High speed (if MAS central is involved or similar)
    // For now, just try another dest stop
    if (destStops[1]) {
        const pathC = findDirectLink(srcStops[0], destStops[1]);
        if (pathC && !routes.find(r => r.routeId === pathC.routeId)) routes.push(pathC);
    }

    // STEP 3: Label algorithmically
    if (routes.length > 0) {
        // Sort for labeling
        const sortedByTime = [...routes].sort((a, b) => a.totalDuration - b.totalDuration);
        const sortedByFare = [...routes].sort((a, b) => a.totalFare - b.totalFare);

        routes.forEach(r => {
            if (r.routeId === sortedByTime[0].routeId) r.label = 'EARLIEST';
            else if (r.routeId === sortedByFare[0].routeId) r.label = 'AFFORDABLE';
            else r.label = 'HYBRID';
        });

        return routes;
    }

    return [];
};

const findDirectLink = (srcStop, destStop) => {
    // Search bus schedules
    const busLink = busSchedules.find(r =>
        (srcStop.name.toLowerCase().includes(r.from.toLowerCase()) || r.from.toLowerCase().includes(srcStop.name.toLowerCase())) &&
        (destStop.name.toLowerCase().includes(r.to.toLowerCase()) || r.to.toLowerCase().includes(destStop.name.toLowerCase()))
    );

    if (busLink) {
        const busDist = 50; // Approximated segment distance
        const fare = busLink.serviceType.includes('TNSTC') ? 15 : 45; // TNSTC is cheaper
        const waitTime = 5 + Math.floor(Math.random() * 10); // Simulated "Starting in"

        return {
            routeId: `bus-${busLink.routeCode}-${srcStop.id}`,
            totalDistanceKm: ((srcStop.dist + destStop.dist) / 1000 + busDist).toFixed(1),
            totalFare: fare,
            startInMinutes: waitTime,
            totalDuration: waitTime + (busDist * 2), // Rough estimate
            steps: [
                { type: 'WALK', distanceMeters: Math.round(srcStop.dist) },
                { type: 'BUS', routeNumber: busLink.routeCode, fare: fare, fromStop: srcStop.name, toStop: destStop.name },
                { type: 'WALK', distanceMeters: Math.round(destStop.dist) }
            ]
        };
    }

    // Search train links (Simplified mock check for now using TRAIN_STATIONS)
    if (srcStop.type === 'TRAIN' && destStop.type === 'TRAIN') {
        const fare = 30; // Flat fare for demo logic
        const waitTime = 12;

        return {
            routeId: `train-${srcStop.code}-${destStop.code}`,
            totalDistanceKm: ((srcStop.dist + destStop.dist) / 1000 + 40).toFixed(1),
            totalFare: fare,
            startInMinutes: waitTime,
            totalDuration: waitTime + 60,
            steps: [
                { type: 'WALK', distanceMeters: Math.round(srcStop.dist) },
                { type: 'TRAIN', routeNumber: `${srcStop.code}-${destStop.code}`, fare: fare, fromStop: srcStop.name, toStop: destStop.name },
                { type: 'WALK', distanceMeters: Math.round(destStop.dist) }
            ]
        };
    }

    return null;
};
