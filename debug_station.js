
import fs from 'fs';

const API_KEY = 'rr_admin_9s2d5f8h1k4m7p0q';
const STATION_CODE = 'MAS';
const SEARCH_QUERY = 'MAS';

const SEARCH_URL = `https://api.railradar.in/api/v1/search/stations?q=${SEARCH_QUERY}&apiKey=${API_KEY}`;
const LIVE_STATION_URL = `https://api.railradar.in/api/v1/stations/${STATION_CODE}/live?hours=4&apiKey=${API_KEY}`;

async function debug() {
    try {
        console.log("Fetching Search:", SEARCH_URL);
        const searchRes = await fetch(SEARCH_URL);
        const searchJson = await searchRes.json();
        fs.writeFileSync('debug_station_search.json', JSON.stringify(searchJson, null, 2));

        console.log("Fetching Live Station:", LIVE_STATION_URL);
        const liveRes = await fetch(LIVE_STATION_URL);
        const liveJson = await liveRes.json();
        fs.writeFileSync('debug_station_live.json', JSON.stringify(liveJson, null, 2));

        console.log("Done. Check debug_station_search.json and debug_station_live.json");
    } catch (e) {
        console.error(e);
    }
}

debug();
