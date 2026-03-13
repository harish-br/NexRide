/**
 * NexRide — Suburban / Local Train Schedules
 * 
 * Schema is future-ready to support:
 *  - intermediateStations: array of { name, code, arrival, departure, platform }
 *  - platform: number or string
 *  - realtimeStatus: { delay, currentStation, lastUpdated }
 * 
 * @typedef {Object} SuburbanTrain
 * @property {string}   trainNumber           - Official train number (may contain "/" for combined services)
 * @property {string}   trainName             - Full name of the train
 * @property {string}   from                  - Origin station name
 * @property {string}   fromCode              - Origin station code (IRCTC)
 * @property {string}   to                    - Destination station name
 * @property {string}   toCode                - Destination station code (IRCTC)
 * @property {string}   departureTime         - Scheduled departure (HH:MM, 24h or "" if not applicable)
 * @property {string}   arrivalTime           - Scheduled arrival  (HH:MM, 24h or "" if not applicable)
 * @property {string}   type                  - Train category: "MEMU" | "EMU" | "DEMU" | "PASS"
 * @property {string}   via                   - Key intermediate station(s), comma-separated, or ""
 * @property {string[]} days                  - Days of operation: ["MON","TUE",...] or ["DAILY"]
 * @property {number|null} platform           - Expected platform at origin (null = TBD)
 * @property {Object[]} intermediateStations  - Reserved for future intermediate stop data
 * @property {Object|null} realtimeStatus     - Reserved for live data integration
 */

export const suburbanTrains = [
    // ─────────────────────────────────────────────────────────────
    // ERODE ↔ COIMBATORE
    // ─────────────────────────────────────────────────────────────
    {
        trainNumber: "06800/66601",
        trainName: "Erode – Coimbatore MEMU",
        from: "Erode",
        fromCode: "ED",
        to: "Coimbatore",
        toCode: "CBE",
        departureTime: "07:15",           // 06800 departure; 07:30 for 66601 — see notes
        departureTimeAlt: "07:30",        // Second service number departure
        arrivalTime: "",
        type: "MEMU",
        via: "Tiruppur",
        days: ["DAILY"],
        platform: null,
        notes: "Runs as 06800 / 66601 — two combined service numbers",
        intermediateStations: [
            // Future: { name: "Tiruppur", code: "TUP", arrival: "08:05", departure: "08:07", platform: null }
        ],
        realtimeStatus: null,
    },
    {
        trainNumber: "66600",
        trainName: "Coimbatore – Erode MEMU",
        from: "Coimbatore",
        fromCode: "CBE",
        to: "Erode",
        toCode: "ED",
        departureTime: "",
        arrivalTime: "20:45",
        type: "MEMU",
        via: "Tiruppur",
        days: ["DAILY"],
        platform: null,
        notes: "",
        intermediateStations: [],
        realtimeStatus: null,
    },

    // ─────────────────────────────────────────────────────────────
    // ERODE ↔ PALAKKAD TOWN
    // ─────────────────────────────────────────────────────────────
    {
        trainNumber: "66607",
        trainName: "Erode – Palakkad Town MEMU",
        from: "Erode",
        fromCode: "ED",
        to: "Palakkad Town",
        toCode: "PGT",
        departureTime: "07:00",
        arrivalTime: "",
        type: "MEMU",
        via: "Coimbatore",
        days: ["DAILY"],
        platform: null,
        notes: "",
        intermediateStations: [],
        realtimeStatus: null,
    },
    {
        trainNumber: "66608",
        trainName: "Palakkad Town – Erode MEMU",
        from: "Palakkad Town",
        fromCode: "PGT",
        to: "Erode",
        toCode: "ED",
        departureTime: "",
        arrivalTime: "",
        type: "MEMU",
        via: "Coimbatore",
        days: ["DAILY"],
        platform: null,
        notes: "Departure / arrival times TBD",
        intermediateStations: [],
        realtimeStatus: null,
    },

    // ─────────────────────────────────────────────────────────────
    // ERODE ↔ SALEM
    // ─────────────────────────────────────────────────────────────
    {
        trainNumber: "66622",
        trainName: "Erode – Salem MEMU",
        from: "Erode",
        fromCode: "ED",
        to: "Salem",
        toCode: "SA",
        departureTime: "19:30",
        arrivalTime: "",
        type: "MEMU",
        via: "",
        days: ["DAILY"],
        platform: null,
        notes: "",
        intermediateStations: [],
        realtimeStatus: null,
    },
    {
        trainNumber: "66621",
        trainName: "Salem – Erode MEMU",
        from: "Salem",
        fromCode: "SA",
        to: "Erode",
        toCode: "ED",
        departureTime: "",
        arrivalTime: "07:25",
        type: "MEMU",
        via: "",
        days: ["DAILY"],
        platform: null,
        notes: "",
        intermediateStations: [],
        realtimeStatus: null,
    },

    // ─────────────────────────────────────────────────────────────
    // SALEM ↔ COIMBATORE (via Erode)
    // ─────────────────────────────────────────────────────────────
    {
        trainNumber: "66602/66603",
        trainName: "Salem – Coimbatore MEMU",
        from: "Salem",
        fromCode: "SA",
        to: "Coimbatore",
        toCode: "CBE",
        departureTime: "",
        arrivalTime: "",
        type: "MEMU",
        via: "Erode",
        days: ["DAILY"],
        platform: null,
        notes: "Runs as 66602 / 66603 — times TBD",
        intermediateStations: [
            // Future: { name: "Erode", code: "ED", arrival: "--", departure: "--", platform: null }
        ],
        realtimeStatus: null,
    },
];

/**
 * Search suburban trains by origin, destination, or train number/name.
 * Case-insensitive partial match.
 */
export const searchSuburbanTrains = (query) => {
    if (!query || query.trim().length < 2) return suburbanTrains;
    const q = query.toLowerCase().trim();
    return suburbanTrains.filter(t =>
        t.from.toLowerCase().includes(q) ||
        t.to.toLowerCase().includes(q) ||
        t.trainNumber.toLowerCase().includes(q) ||
        t.trainName.toLowerCase().includes(q) ||
        t.via.toLowerCase().includes(q)
    );
};

/**
 * Filter suburbs trains by route pair (origin → destination or reverse).
 */
export const findSuburbanTrains = (from, to) => {
    if (!from && !to) return suburbanTrains;
    const f = from?.toLowerCase().trim() || '';
    const t = to?.toLowerCase().trim() || '';
    return suburbanTrains.filter(tr => {
        const fromMatch = !f || tr.from.toLowerCase().includes(f) || tr.fromCode.toLowerCase() === f;
        const toMatch   = !t || tr.to.toLowerCase().includes(t)   || tr.toCode.toLowerCase() === t;
        return fromMatch && toMatch;
    });
};
