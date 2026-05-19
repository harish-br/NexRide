const API_KEY = import.meta.env.VITE_RAILRADAR_API_KEY;
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

// --- NORMALIZATION LAYER (Step 2 & 3) ---
const normalizeTrainData = (t) => {
    const trainInfo = t.train || {};
    const live = t.live || {};
    const schedule = t.schedule || {};
    const status = t.status || {};

    // Map to standardized fields (snake_case from API -> camelCase for App)
    const data = {
        number: trainInfo.number || "—",
        name: trainInfo.name || "Train",
        scheduledArrival: schedule.arrival,
        expectedArrival: live.expectedArrival,
        scheduledDeparture: schedule.departure,
        expectedDeparture: live.expectedDeparture,
        delay: live.arrivalDelayMinutes || live.departureDelayMinutes || (live.arrivalDelayDisplay ? parseInt(live.arrivalDelayDisplay) : 0) || 0,
        platform: t.platform || "—",
        hasArrived: status.hasArrived,
        hasDeparted: status.hasDeparted,
        isCancelled: status.isCancelled
    };

    // Selecting primary time (Step 3: expected > scheduled)
    const rawArrival = data.expectedArrival || data.scheduledArrival;
    const rawDeparture = data.expectedDeparture || data.scheduledDeparture;

    // Formatting (Step 4, 5, 6)
    data.displayArrival = getDisplayTime(rawArrival);
    data.displayDeparture = getDisplayTime(rawDeparture);

    // Debugging (Step 8)
    console.log(`[Train] ${data.name} (${data.number})`);
    console.log(`- Scheduled Arrival: ${data.scheduledArrival} | Expected Arrival: ${data.expectedArrival}`);
    console.log(`- Final Display Time: ${data.displayArrival}`);

    return data;
};

// --- FAIL-SAFE TIME FORMATTING (Bypasses Timezone Bugs) ---
const getDisplayTime = (timeRaw) => {
    if (!timeRaw || timeRaw === "--") return "—";

    // CASE 1: Standard "HH:MM" or "HH:MM:SS" (API Local Time)
    // We parse this manually to avoid ANY browser/system timezone shifts.
    if (typeof timeRaw === 'string' && timeRaw.includes(':') && !timeRaw.includes('T')) {
        try {
            const parts = timeRaw.split(':');
            let h = parseInt(parts[0]);
            let m = parseInt(parts[1]);
            
            if (isNaN(h) || isNaN(m)) return "—";
            
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            const mm = m.toString().padStart(2, '0');
            
            return `${h12}:${mm} ${ampm}`;
        } catch (e) {
            return "—";
        }
    }

    // CASE 2: ISO Strings or Unix Timestamps (Global Time)
    // These MUST be shifted to Asia/Kolkata.
    try {
        let date;
        if (typeof timeRaw === 'string' && (timeRaw.includes('T') || timeRaw.includes('Z'))) {
            date = new Date(timeRaw);
        } else {
            const num = Number(timeRaw);
            if (isNaN(num)) return "—";
            // 10-digit = seconds, 13-digit = ms
            date = new Date(num < 200000000000 ? num * 1000 : num);
        }

        return date.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    } catch (err) {
        console.error("Format Error:", err);
        return "—";
    }
};

// PROCESSING LOGIC FOR STATION LIVE DATA (Step 7)
const processStationData = (response) => {
    if (!response) return null;
    const rawData = response.data || response;

    if (!rawData.trains || !Array.isArray(rawData.trains)) {
        return { atStation: [], arriving: [], departing: [], stationName: rawData.station?.name || "—" };
    }

    // Apply normalization consistently to all trains (Step 7)
    const normalizedTrains = rawData.trains.map(normalizeTrainData);

    return {
        atStation: normalizedTrains.filter(t => t.hasArrived && !t.hasDeparted),
        arriving: normalizedTrains.filter(t => !t.hasArrived && !t.hasDeparted),
        departing: normalizedTrains.filter(t => t.hasDeparted),
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

// Helper to parse "HH:MM" to minutes from midnight
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return -1;
    let hh, mm;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
        // Already formatted by our getDisplayTime
        const [time, modifier] = timeStr.trim().split(' ');
        [hh, mm] = time.split(':').map(Number);
        if (modifier === 'PM' && hh < 12) hh += 12;
        if (modifier === 'AM' && hh === 12) hh = 0;
    } else {
        [hh, mm] = timeStr.trim().split(':').map(Number);
    }
    
    if (isNaN(hh) || isNaN(mm)) return -1;
    return hh * 60 + mm;
};

// PROCESSING LOGIC FOR LIVE STATUS (ROUTE)
const processTrainStatus = (response) => {
    if (!response || !response.route || !Array.isArray(response.route)) {
        console.error("Invalid API Response: route missing");
        return null;
    }

    const trainName = response.trainName || response.train_name || "Train";
    const trainNumber = response.trainNumber || response.train_number || "—";
    const route = response.route;

    const apiCurrentLocation = response.currentLocation || response.current_location;
    const currentParam = apiCurrentLocation ? (apiCurrentLocation.stationCode || apiCurrentLocation.station_code) : null;

    let validCurrentIndex = -1;
    if (currentParam) {
        validCurrentIndex = route.findIndex(s => s.stationCode === currentParam);
    }

    // Time-based fallback
    if (validCurrentIndex === -1) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        let lastPassedIndex = -1;
        for (let i = 0; i < route.length; i++) {
            const s = route[i];
            const checkTimeStr = s.actualDeparture || s.scheduledDeparture || s.actualArrival || s.scheduledArrival;
            const checkMins = parseTimeToMinutes(checkTimeStr);
            if (checkMins !== -1 && checkMins <= currentMins) {
                lastPassedIndex = i;
            }
        }
        if (lastPassedIndex !== -1) validCurrentIndex = lastPassedIndex;
    }

    const currentLocParams = validCurrentIndex !== -1 ? route[validCurrentIndex] : null; 
    const nextLocParams = (validCurrentIndex !== -1 && validCurrentIndex + 1 < route.length) ? route[validCurrentIndex + 1] : null;

    const currentLocation = currentLocParams ? {
        name: currentLocParams.stationName || currentLocParams.stationCode,
        code: currentLocParams.stationCode,
        distance: currentLocParams.distanceFromOriginKm || 0,
        platform: currentLocParams.platform || '--',
        time: getDisplayTime(currentLocParams.actualDeparture || currentLocParams.actualArrival),
        delay: currentLocParams.delayDepartureMinutes || currentLocParams.delayArrivalMinutes || 0,
        lat: currentLocParams.stationLat || currentLocParams.lat,
        lng: currentLocParams.stationLng || currentLocParams.lng,
        stationName: currentLocParams.stationName || currentLocParams.stationCode,
        stationCode: currentLocParams.stationCode
    } : null;

    const nextStationInfo = nextLocParams ? {
        name: nextLocParams.stationName || nextLocParams.stationCode,
        distanceRemaining: currentLocParams ? ((nextLocParams.distanceFromOriginKm || 0) - (currentLocParams.distanceFromOriginKm || 0)) : 0,
        delay: nextLocParams.delayArrivalMinutes || nextLocParams.delayDepartureMinutes || 0
    } : null;

    const timeline = route.map((station, index) => ({
        stationName: station.stationName || station.stationCode,
        stationCode: station.stationCode,
        distance: station.distanceFromOriginKm || 0,
        scheduledArrival: getDisplayTime(station.scheduledArrival),
        actualArrival: getDisplayTime(station.actualArrival),
        scheduledDeparture: getDisplayTime(station.scheduledDeparture),
        actualDeparture: getDisplayTime(station.actualDeparture),
        delayMinutes: station.delayArrivalMinutes || station.delayDepartureMinutes || 0,
        platform: station.platform || '--',
        isCurrent: index === validCurrentIndex,
        hasPassed: index <= validCurrentIndex
    }));

    const overallDelay = currentLocation?.delay || nextStationInfo?.delay || 0;
    
    return {
        trainName,
        trainNumber,
        lastUpdated: response.lastUpdatedAt || new Date().toISOString(),
        source: timeline[0]?.stationCode,
        destination: timeline[timeline.length - 1]?.stationCode,
        currentLocation: currentLocation,
        currentStation: currentLocation?.name || "Source",
        nextStationInfo: nextStationInfo,
        isLate: overallDelay > 0,
        overallDelay: overallDelay,
        timeline: timeline,
        statusSummary: overallDelay > 0 ? `Delayed by ${overallDelay} min` : "On Time"
    };
};
