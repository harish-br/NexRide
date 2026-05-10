import json
import math
from datetime import datetime, time
from typing import List, Dict, Any, Optional

# Constants
EARTH_RADIUS_KM = 6371.0
DATA_PATH = "/mnt/user-data/outputs/bus_timings.json"

# Coordinates for known bus stands (Source Locations)
BUS_STAND_COORDINATES = {
    "Erode": {"lat": 11.3410, "lon": 77.7172, "district": "Erode"},
    "Anthiyur": {"lat": 11.5833, "lon": 77.6000, "district": "Erode"},
    "Ooty": {"lat": 11.4102, "lon": 76.6991, "district": "Nilgiris"},
    "Coonoor": {"lat": 11.3530, "lon": 76.7959, "district": "Nilgiris"},
    "Mettupalayam": {"lat": 11.3008, "lon": 76.9405, "district": "Coimbatore"},
    "Coimbatore": {"lat": 11.0168, "lon": 76.9558, "district": "Coimbatore"},
    "Chennai": {"lat": 13.0827, "lon": 80.2707, "district": "Chennai"},
    "Salem": {"lat": 11.6643, "lon": 78.1460, "district": "Salem"},
    "Tiruppur": {"lat": 11.1085, "lon": 77.3411, "district": "Tiruppur"},
    "Palani": {"lat": 10.4492, "lon": 77.5271, "district": "Dindigul"},
    "Dharapuram": {"lat": 10.7289, "lon": 77.5195, "district": "Tiruppur"},
    "Kangayam": {"lat": 11.0044, "lon": 77.5645, "district": "Tiruppur"},
    "Sathyamangalam": {"lat": 11.5034, "lon": 77.2444, "district": "Erode"},
    "Gobichettipalayam": {"lat": 11.4533, "lon": 77.4377, "district": "Erode"},
    "Bhavani": {"lat": 11.4485, "lon": 77.6836, "district": "Erode"},
    "Gudalur": {"lat": 11.5034, "lon": 76.4914, "district": "Nilgiris"},
    "Karur": {"lat": 10.9601, "lon": 78.0766, "district": "Karur"},
    "Trichy": {"lat": 10.7905, "lon": 78.7047, "district": "Tiruchirappalli"},
    "Madurai": {"lat": 9.9252, "lon": 78.1198, "district": "Madurai"},
    "Bangalore": {"lat": 12.9716, "lon": 77.5946, "district": "Bangalore"},
    "Mysore": {"lat": 12.2958, "lon": 76.6394, "district": "Mysuru"}
}

def load_bus_data() -> List[Dict[str, Any]]:
    """Loads the bus timing data from the JSON file."""
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        # Fallback to local file if mnt path fails
        try:
            with open("bus_timings.json", 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the geographic distance between two points using the Haversine formula."""
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c

def reverse_geocode(lat: float, lon: float) -> Dict[str, str]:
    """
    Simulates reverse geocoding to determine city and district.
    In a production API, this would use geopy.geocoders or a mapping service.
    """
    # Finding the nearest known location as a fallback for reverse geocoding logic
    nearest_loc = None
    min_dist = float('inf')
    
    for name, coords in BUS_STAND_COORDINATES.items():
        dist = calculate_distance(lat, lon, coords['lat'], coords['lon'])
        if dist < min_dist:
            min_dist = dist
            nearest_loc = {"city": name, "district": coords['district']}
            
    # If the user is very close to a known city (within 10km), we assume that city
    if min_dist < 10:
        return nearest_loc
    
    # Generic return if not very close to any predefined bus stand
    return nearest_loc or {"city": "Unknown", "district": "Unknown"}

def find_matching_bus_stands(city: str, district: str, user_lat: float, user_lon: float) -> Optional[str]:
    """Identifies the best matching bus stand based on proximity and data availability."""
    # 1. Check for exact city match in coordinates
    if city in BUS_STAND_COORDINATES:
        return city
        
    # 2. Find all bus stands in the same district
    district_matches = [name for name, info in BUS_STAND_COORDINATES.items() if info['district'] == district]
    
    if district_matches:
        # Choose the closest one within the district
        best_match = None
        min_dist = float('inf')
        for name in district_matches:
            dist = calculate_distance(user_lat, user_lon, BUS_STAND_COORDINATES[name]['lat'], BUS_STAND_COORDINATES[name]['lon'])
            if dist < min_dist:
                min_dist = dist
                best_match = name
        return best_match

    # 3. Last resort: Find the absolute nearest source stand globally
    best_match = None
    min_dist = float('inf')
    for name, coords in BUS_STAND_COORDINATES.items():
        dist = calculate_distance(user_lat, user_lon, coords['lat'], coords['lon'])
        if dist < min_dist:
            min_dist = dist
            best_match = name
    return best_match

def get_next_departures(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filters and sorts upcoming departures for a list of routes."""
    now = datetime.now().time()
    arrivals = []

    for route in routes:
        departure_times = route.get("departure_times", [])
        upcoming = []
        
        # Convert string times to time objects and filter
        for t_str in departure_times:
            try:
                h, m = map(int, t_str.split(':'))
                dep_time = time(h, m)
                if dep_time > now:
                    upcoming.append(t_str)
            except ValueError:
                continue
        
        if upcoming:
            # Sort by time
            upcoming.sort()
            arrivals.append({
                "destination": route.get("destination"),
                "operator": route.get("operator", "TNSTC"),
                "next_departure": upcoming[0],
                "all_remaining_departures": upcoming,
                "notes": route.get("notes", "")
            })
        elif departure_times:
            # All departures passed, show first for tomorrow
            departure_times.sort()
            arrivals.append({
                "destination": route.get("destination"),
                "operator": route.get("operator", "TNSTC"),
                "next_departure": departure_times[0],
                "all_remaining_departures": departure_times,
                "notes": f"Tomorrow: {route.get('notes', '')}".strip()
            })

    # Sort arrivals by the earliest next_departure
    arrivals.sort(key=lambda x: x['next_departure'])
    return arrivals

def get_location_based_arrivals(lat: float, lon: float) -> str:
    """Main function to determine location and return nearby bus arrivals."""
    # 1. Reverse Geocode
    location = reverse_geocode(lat, lon)
    city = location.get("city")
    district = location.get("district")

    # 2. Find best bus stand
    selected_stand = find_matching_bus_stands(city, district, lat, lon)
    
    # 3. Calculate distance to the selected stand
    dist_km = 0.0
    if selected_stand:
        coords = BUS_STAND_COORDINATES[selected_stand]
        dist_km = round(calculate_distance(lat, lon, coords['lat'], coords['lon']), 2)

    # 4. Load data and filter by selected source
    all_data = load_bus_data()
    matched_routes = [r for r in all_data if r.get("source") == selected_stand]
    
    # 5. Get next departures
    next_arrivals = get_next_departures(matched_routes)

    # 6. Construct JSON response
    response = {
        "detected_location": {
            "city": city,
            "district": district
        },
        "selected_bus_stand": selected_stand,
        "distance_km": dist_km,
        "next_arrivals": next_arrivals
    }

    return json.dumps(response, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    # Example usage for testing (Ooty)
    import sys
    if len(sys.argv) > 2:
        print(get_location_based_arrivals(float(sys.argv[1]), float(sys.argv[2])))
    else:
        # Default Ooty example
        print(get_location_based_arrivals(11.4102, 76.6991))
