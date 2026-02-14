const API_KEY = import.meta.env.VITE_RAILRADAR_API_KEY || 'rr_admin_9s2d5f8h1k4m7p0q';
const BASE_URL = 'https://api.railradar.in/api/v1';

// In-memory cache
const apiCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds for live data

const getHeaders = () => ({
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
});

// Helper for caching and retrying
const fetchWithCache = async (url, retries = 1) => {
    console.log(`[RailRadar] Requesting: ${url}`);

    if (apiCache.has(url)) {
        const { timestamp, data } = apiCache.get(url);
        if (Date.now() - timestamp < CACHE_TTL) {
            return data;
        }
    }

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders()
        });

        if (response.status === 401) throw new Error("Unauthorized (401) - Check API Key");
        if (response.status === 404) throw new Error("No data available (404)");
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        apiCache.set(url, { timestamp: Date.now(), data });
        return data;
    } catch (error) {
        console.error(`[RailRadar] Error: ${error.message}`);
        throw error;
    }
};

// PROCESSING LOGIC FOR STATION LIVE DATA
const processStationData = (response) => {
    if (!response) return null;

    // Support nested data structure from API
    const rawData = response.data || response;

    // Validations
    if (!rawData.trains || !Array.isArray(rawData.trains)) {
        return {
            atStation: [],
            arriving: [],
            departing: [],
            station: rawData.station || {}
        };
    }

    const trains = rawData.trains.map(t => {
        // Safe access helpers
        const trainInfo = t.train || {};
        const live = t.live || {};
        const schedule = t.schedule || {};
        const status = t.status || {};

        return {
            trainName: trainInfo.name || "Train",
            trainNumber: trainInfo.number || "—",
            platform: t.platform || "TBD",

            // Time logic
            scheduledArrival: formatTime(schedule.arrival),
            expectedArrival: formatTime(live.expectedArrival),
            scheduledDeparture: formatTime(schedule.departure),
            expectedDeparture: formatTime(live.expectedDeparture),

            // Status logic
            status: status.hasDeparted ? 'DEPARTED' :
                (status.hasArrived ? 'ARRIVED' :
                    (status.isCancelled ? 'CANCELLED' : 'ON TIME')),

            // Delay text
            delayText: live.arrivalDelayDisplay ? `Late ${live.arrivalDelayDisplay}` :
                (live.departureDelayDisplay ? `Late ${live.departureDelayDisplay}` : 'On Time'),

            // Categorization flags
            hasArrived: status.hasArrived,
            hasDeparted: status.hasDeparted
        };
    });

    // Categorize
    const atStation = trains.filter(t => t.hasArrived && !t.hasDeparted);
    const arriving = trains.filter(t => !t.hasArrived && !t.hasDeparted);
    const departing = trains.filter(t => t.hasDeparted);

    return {
        atStation,
        arriving,
        departing,
        stationName: rawData.station?.name || rawData.station?.code,
        stationCode: rawData.station?.code
    };
};

export const fetchLiveStationData = async (stationCode) => {
    try {
        const url = `${BASE_URL}/stations/${stationCode}/live?hours=4&apiKey=${API_KEY}`;
        const data = await fetchWithCache(url);
        return processStationData(data);
    } catch (error) {
        console.error('Fetch Live Station Failed:', error);
        throw error;
    }
};

export const fetchTrainStatus = async (trainNumber) => {
    try {
        // CORRECTED ENDPOINT: /api/v1/trains/{number}?dataType=live
        const url = `https://api.railradar.in/api/v1/trains/${trainNumber}?dataType=live&apiKey=${API_KEY}`;

        console.log(`[RailRadar] Requesting Live Status: ${url}`);

        const response = await fetch(url, { method: 'GET' });

        if (response.status === 401) throw new Error("Unauthorized - Check API Key");
        if (response.status === 404) throw new Error("Train not running or data unavailable (404)");
        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();

        // Unwrap live data
        const liveData = data.data || data;

        // Fix: If trainName is missing (common in live API), fetch from static details endpoint
        if (!liveData.trainName || liveData.trainName === 'Train') {
            try {
                // We can use the existing cache mechanism or a quick fetch
                console.log('[RailRadar] Train Name missing, fetching static details...');
                // Note: Static details endpoint does NOT need dataType=live
                const staticUrl = `https://api.railradar.in/api/v1/trains/${trainNumber}?apiKey=${API_KEY}`;

                // Use the existing cache if possible
                const staticData = await fetchWithCache(staticUrl);
                if (staticData && staticData.data && staticData.data.train) {
                    liveData.trainName = staticData.data.train.trainName;
                }
            } catch (err) {
                console.warn('[RailRadar] Failed to fetch static train name:', err);
            }
        }

        return { data: processTrainStatus(liveData) };
    } catch (error) {
        console.error('Fetch Train Status Failed:', error);
        throw error;
    }
};

export const searchStations = async (query) => {
    if (!query || query.length < 2) return [];
    try {
        // Updated to matching base URL pattern
        const url = `https://api.railradar.in/api/v1/search/stations?query=${query}&apiKey=${API_KEY}`;
        const data = await fetchWithCache(url);
        // Robust handling for wrapped data structure
        const stations = data.data?.stations || data.stations || [];
        return stations;
    } catch (error) {
        console.error('Station Search Failed:', error);
        return [];
    }
};

// Helper to format Unix timestamp to HH:MM
const formatTime = (ts) => {
    if (!ts) return "--";
    // If it's already a time string like "10:30", return it
    if (typeof ts === 'string' && ts.includes(':')) return ts;
    // Handle Unix timestamp (assuming seconds based on previous observation, but checking length)
    // If > 20000000000, probably ms? RailRadar usually uses seconds or standard ms. 
    // Let's safe check: 1766536200 is 2025... so it's seconds.
    const date = new Date(ts * 1000);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// Helper to parse "HH:MM" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return -1;
    const [hh, mm] = timeStr.trim().split(':').map(Number);
    if (isNaN(hh) || isNaN(mm)) return -1;
    return hh * 60 + mm;
};

// PROCESSING LOGIC FOR NEW CAMELCASE RESPONSE
const processTrainStatus = (response) => {
    // 1. Validate mandatory fields (Now camelCase)
    if (!response || !response.route || !Array.isArray(response.route)) {
        console.error("Invalid API Response: route missing");
        return null;
    }

    // 2. Read Top-Level Data (camelCase or snake_case fallback)
    const trainName = response.trainName || response.train_name || "Train";
    const trainNumber = response.trainNumber || response.train_number || "—";

    const route = response.route;

    // 3. Process Route & Identify Current Location

    // STRATEGY A: Explicit "currentLocation" object from API
    // Handle both camelCase and snake_case keys
    const apiCurrentLocation = response.currentLocation || response.current_location;
    const currentParam = apiCurrentLocation
        ? (apiCurrentLocation.stationCode || apiCurrentLocation.station_code)
        : null;

    let validCurrentIndex = -1;

    if (currentParam) {
        validCurrentIndex = route.findIndex(s => s.stationCode === currentParam);
    }

    // STRATEGY B: Time-Based Fallback (If API gives no explicit current station)
    // We walk the route and find the last station where (actualTime <= currentTime)
    if (validCurrentIndex === -1) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        // We need to handle day wrapping (e.g. 23:00 -> 01:00).
        // Simple heuristic: If the route is sorted, we just check each station.
        // We assume the train is running "today" or "yesterday" relevant to the times shown.
        // To avoid complex date math without dates, we just assume:
        // A station is passed if its time is "earlier" than now (with some overnight tolerance).
        // Since this is a fallback, a simple check is better than nothing.

        let lastPassedIndex = -1;

        for (let i = 0; i < route.length; i++) {
            const s = route[i];
            // Prefer actual, then scheduled
            const depStr = s.actualDeparture || s.scheduledDeparture;
            const arrStr = s.actualArrival || s.scheduledArrival;

            // Use departure for "passed" check, arrival for "reached" check
            const checkTimeStr = depStr || arrStr;
            const checkMins = parseTimeToMinutes(checkTimeStr);

            if (checkMins !== -1) {
                // Direct comparison for same-day
                if (checkMins <= currentMins) {
                    lastPassedIndex = i;
                }
                // Handle late night trains (e.g. current 01:00, station 23:00 - considered passed yesterday?)
                // This is hard without explicit day count. API 'distance' might help?
                // For now, simple <= is the safest MVP fallback.
            }
        }

        if (lastPassedIndex !== -1) {
            validCurrentIndex = lastPassedIndex;
        }
    }

    // 4. Build Detailed Current Location Object
    // "currentStation" for the UI usually implies "Last Reported Station".
    const currentLocParams = validCurrentIndex !== -1 ? route[validCurrentIndex] : null; // The station we are at or just left

    // nextStation is simply the one after current
    const nextLocParams = (validCurrentIndex !== -1 && validCurrentIndex + 1 < route.length)
        ? route[validCurrentIndex + 1]
        : null;

    // Build the objects
    const currentLocation = currentLocParams ? {
        name: currentLocParams.stationName || currentLocParams.stationCode,
        code: currentLocParams.stationCode,
        distance: currentLocParams.distanceFromOriginKm || 0,
        platform: currentLocParams.platform || '--',
        time: formatTime(currentLocParams.actualDeparture || currentLocParams.actualArrival),
        delay: currentLocParams.delayDepartureMinutes || currentLocParams.delayArrivalMinutes || 0,

        // Coordinates for Map
        // API usually provides lat/lng in station object (e.g. stationLat, stationLng)
        lat: currentLocParams.stationLat || currentLocParams.lat,
        lng: currentLocParams.stationLng || currentLocParams.lng,

        // Strict keys for UI compat
        stationName: currentLocParams.stationName || currentLocParams.stationCode,
        stationCode: currentLocParams.stationCode
    } : null;

    const nextStationInfo = nextLocParams ? {
        name: nextLocParams.stationName || nextLocParams.stationCode,
        distanceRemaining: currentLocParams ? ((nextLocParams.distanceFromOriginKm || 0) - (currentLocParams.distanceFromOriginKm || 0)) : 0,
        delay: nextLocParams.delayArrivalMinutes || nextLocParams.delayDepartureMinutes || 0
    } : null;

    // 6. Timeline & Icon Logic
    const timeline = route.map((station, index) => ({
        stationName: station.stationName || station.stationCode,
        stationCode: station.stationCode,
        distance: station.distanceFromOriginKm || 0,

        // Time mapping (camelCase)
        scheduledArrival: formatTime(station.scheduledArrival),
        actualArrival: formatTime(station.actualArrival),
        scheduledDeparture: formatTime(station.scheduledDeparture),
        actualDeparture: formatTime(station.actualDeparture),
        delayMinutes: station.delayArrivalMinutes || station.delayDepartureMinutes || 0,
        platform: station.platform || '--',

        // UI RULE: isCurrent ONLY if index === validCurrentIndex
        // This puts the pulsing dot on the last updated station.
        isCurrent: index === validCurrentIndex,

        // hasPassed is true for everything BEFORE current. 
        // Current itself is "active", not "past_grey", but usually we color it uniquely.
        // If we want the line to be blue UP TO current, we include current in hasPassed logic or handle UI.
        hasPassed: index <= validCurrentIndex
    }));

    // Overall Delay is usually drawn from the current or next station's delay stats
    const overallDelay = currentLocation?.delay || nextStationInfo?.delay || 0;

    // Name to display in the floating pill
    const displayStationName = currentLocation?.name || "Source";

    return {
        trainName,
        trainNumber,
        lastUpdated: response.lastUpdatedAt || new Date().toISOString(),
        source: timeline[0]?.stationCode,
        destination: timeline[timeline.length - 1]?.stationCode,

        currentLocation: currentLocation,
        currentStation: displayStationName, // <--- EXPLICIT: Last visited station name
        nextStationInfo: nextStationInfo,

        isLate: overallDelay > 0,
        overallDelay: overallDelay,

        timeline: timeline,
        statusSummary: response.statusSummary || "Live Status"
    };
};
