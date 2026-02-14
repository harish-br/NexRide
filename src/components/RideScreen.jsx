import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Info, ArrowDown, Navigation, LocateFixed, X, Loader2, ArrowLeft, Banknote, ChevronRight, User, Star, Plus, Minus, Phone } from 'lucide-react';
import { Map, useMap, useMapsLibrary, AdvancedMarker, Marker } from '@vis.gl/react-google-maps';
import haptics from '../utils/haptics';
import { rideService } from '../services/rideService';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

// Assets
import MiniCar from '../assets/vehicle-mini.png';
import SedanCar from '../assets/vehicle-sedan.png';
import XLCar from '../assets/vehicle-xl.png';
import RideBottomSheet from './RideBottomSheet';

const API_KEY = "AIzaSyDlpxJyvl6FFHQGVO3_i-FsTO_-L9GlLO8";
const DEFAULT_CENTER = { lat: 11.341, lng: 77.7172 }; // Erode, India

// --- MAP COMPONENTS (Defined outside to avoid recreation and correctly use context) ---

const Polyline = ({ path, options }) => {
    const map = useMap(); // Access map from context
    const polylineRef = useRef(null);

    // Initial Create & Cleanup
    useEffect(() => {
        if (!map || !window.google || !path) return;

        console.log("[Polyline] Creating polyline with path length:", path.length);
        const line = new window.google.maps.Polyline({
            path,
            map,
            ...options
        });

        polylineRef.current = line;

        return () => {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }
        };
    }, [map, path]); // Re-create if path or map changes

    // Dynamic options update
    useEffect(() => {
        if (polylineRef.current && options) {
            polylineRef.current.setOptions(options);
        }
    }, [options]);

    return null;
};

const CustomDirectionsRenderer = ({ directions }) => {
    if (!directions || !directions.routes || !directions.routes[0]) return null;

    const route = directions.routes[0];
    const path = route.overview_path;

    return (
        <>
            {/* Shadow/Casing Layer - Subtle darker outline for contrast */}
            <Polyline
                path={path}
                options={{
                    strokeColor: '#000000',
                    strokeWeight: 8, // Slightly wider than main line
                    strokeOpacity: 0.2, // Subtle shadow
                    zIndex: 100, // Below main line
                    geodesic: true,
                    clickable: false,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                }}
            />
            {/* Main Route Layer - Black */}
            <Polyline
                path={path}
                options={{
                    strokeColor: '#000000', // User requested Black
                    strokeWeight: 5,
                    strokeOpacity: 1.0,
                    zIndex: 101, // Above shadow
                    geodesic: true,
                    clickable: false,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round'
                }}
            />
        </>
    );
};

const Circle = ({ center, radius, options }) => {
    const map = useMap();
    const circleRef = useRef(null);

    useEffect(() => {
        if (!map || !window.google) return;

        const circle = new window.google.maps.Circle({
            map,
            center,
            radius,
            ...options
        });

        circleRef.current = circle;

        return () => {
            if (circleRef.current) circleRef.current.setMap(null);
        };
    }, [map]);

    useEffect(() => {
        if (circleRef.current) {
            circleRef.current.setOptions({ center, radius, ...options });
        }
    }, [center, radius, options]);

    return null;
};

const RideScreen = ({ onBookRide, userPosition, userAddress }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    // Search State
    const [sourceQuery, setSourceQuery] = useState(userAddress || "");
    const [destQuery, setDestQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeInput, setActiveInput] = useState(null);
    const [isManualInput, setIsManualInput] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);

    // Booking State
    const [rideStep, setRideStep] = useState('search'); // 'search', 'choose-ride', 'confirm-pickup'
    const [selectedVehicle, setSelectedVehicle] = useState('sedan');
    const [directions, setDirections] = useState(null);
    const [sourceLocation, setSourceLocation] = useState(null); // {lat, lng}
    const [destLocation, setDestLocation] = useState(null);     // {lat, lng}

    // Bottom Sheet State
    const [sheetState, setSheetState] = useState('collapsed'); // 'collapsed', 'mid', 'expanded'

    const debounceTimeout = useRef(null);
    const sourceInputRef = useRef(null);
    const map = useMap('booking-map');
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState(null);

    // Booking State
    const [bookingStatus, setBookingStatus] = useState('IDLE'); // IDLE, SEARCHING, ACCEPTED, NO_DRIVER
    const [currentTrip, setCurrentTrip] = useState(null);
    const [assignedDriver, setAssignedDriver] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null); // { lat, lng }
    const [mapCenter, setMapCenter] = useState(null); // Track center manually
    const [isPickupConfirmed, setIsPickupConfirmed] = useState(false);
    const searchTimeoutRef = useRef(null);
    const tripListenerRef = useRef(null);
    const driverLocationListenerRef = useRef(null);
    const hasInitialFit = useRef(false);

    // Initialize Directions Service (Does not need map instance)
    useEffect(() => {
        if (!routesLibrary) return;
        setDirectionsService(new routesLibrary.DirectionsService());
    }, [routesLibrary]);

    // Calculate Route when Choosing Ride
    useEffect(() => {
        if (rideStep === 'choose-ride' && directionsService && sourceLocation && destLocation) {
            console.log("[RideScreen] Calculating route...", { sourceLocation, destLocation });
            directionsService.route({
                origin: sourceLocation,
                destination: destLocation,
                travelMode: 'DRIVING',
                provideRouteAlternatives: true
            }).then(response => {
                console.log("[RideScreen] Route calculated successfully:", response);
                setDirections(response);
            }).catch(err => {
                console.error("[RideScreen] Route calculation failed:", err);
            });
        }
    }, [rideStep, directionsService, sourceLocation, destLocation]);

    // Auto-zoom to Route when directions are loaded
    useEffect(() => {
        if (map && directions && rideStep === 'choose-ride' && !hasInitialFit.current) {
            const bounds = directions.routes[0].bounds;
            if (bounds) {
                map.fitBounds(bounds, {
                    padding: { top: 80, bottom: 350, left: 50, right: 50 }
                });
                hasInitialFit.current = true;
            }
        }
    }, [map, directions, rideStep]);

    // Reset initial fit when starting a new search
    useEffect(() => {
        if (rideStep === 'search') {
            hasInitialFit.current = false;
        }
    }, [rideStep]);

    // Auto-zoom to Pickup when Confirm Mode starts (Always force view)
    // Auto-zoom to Pickup when Confirm Mode starts (Always force view)
    useEffect(() => {
        if (rideStep === 'confirm-pickup' && map && sourceLocation && !isPickupConfirmed) {
            map.setCenter(sourceLocation); // INSTANT snap (no animation)
            map.setZoom(18); // Zoom level 18 for 100m precision
        }
    }, [rideStep, map]); // Removed sourceLocation to prevent drag-loop



    // Resolve Live Location (Initial)
    useEffect(() => {
        // Prevent GPS from overriding manual adjustments during 'confirm-pickup'
        if (!isManualInput && !isPickupConfirmed && rideStep !== 'confirm-pickup') {
            // 1. Always sync coordinates from GPS if available
            if (userPosition) {
                const { lat, lng } = userPosition;
                // Only update if actually changed to avoid cycles (though simple obj check is fine here)
                setSourceLocation(prev => {
                    if (!prev || prev.lat !== lat || prev.lng !== lng) {
                        return { lat, lng };
                    }
                    return prev;
                });
            }

            // 2. Sync Address Label
            if (userAddress) {
                setSourceQuery(userAddress);
                setIsResolvingLocation(false);
            } else if (userPosition) {
                setIsResolvingLocation(true);
                const { lat, lng } = userPosition;

                // Fallback Geocoding if userAddress (from App.jsx) isn't ready yet
                fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.results && data.results[0]) {
                            const comps = data.results[0].address_components;
                            const neighborhood = comps.find(c => c.types.includes("sublocality_level_1"))?.long_name;
                            const area = comps.find(c => c.types.includes("sublocality_level_2"))?.long_name;
                            const street = comps.find(c => c.types.includes("route"))?.long_name;
                            const locality = comps.find(c => c.types.includes("locality"))?.long_name;

                            let addr = neighborhood || area || street || locality || data.results[0].formatted_address.split(',')[0];
                            if (locality && addr !== locality) {
                                addr += `, ${locality}`;
                            }
                            setSourceQuery(addr);
                        } else {
                            setSourceQuery("");
                        }
                    })
                    .catch(() => setSourceQuery(""))
                    .finally(() => setIsResolvingLocation(false));
            } else {
                // No Position yet
                setSourceQuery(t('common.fetching_location')); // Or keep empty
                setIsResolvingLocation(true);
            }
        }
    }, [userPosition, userAddress, isManualInput, t]);

    // Fetch Suggestions
    const fetchSuggestions = async (input) => {
        if (!input || input.length < 1) return;
        try {
            const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': API_KEY,
                    'X-Goog-FieldMask': '*'
                },
                body: JSON.stringify({ input: input, includedRegionCodes: ['IN'] })
            });
            const data = await response.json();
            if (data.suggestions) {
                const formatted = data.suggestions.map(s => {
                    const placePrediction = s.placePrediction;
                    return {
                        id: placePrediction.placeId || placePrediction.place,
                        name: placePrediction.structuredFormat?.mainText?.text || placePrediction.text?.text,
                        subtitle: placePrediction.structuredFormat?.secondaryText?.text || '',
                        original: placePrediction
                    };
                });
                setSuggestions(formatted);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (e) {
            console.error(e);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = (val, type) => {
        if (type === 'source') {
            setSourceQuery(val);
            if (!isManualInput) setIsManualInput(true);
        } else {
            setDestQuery(val);
        }
        setActiveInput(type);

        if (val.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const getPlaceDetails = async (placeId) => {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location&key=${API_KEY}`);
        const data = await response.json();
        return data.location; // {latitude, longitude}
    }

    const handleSelect = async (item) => {
        haptics.light();

        let coords = null;
        try {
            // Fetch coords for the selected place
            const loc = await getPlaceDetails(item.id);
            coords = { lat: loc.latitude, lng: loc.longitude };
        } catch (e) {
            console.error("Failed to fetch details", e);
        }

        if (activeInput === 'source') {
            setSourceQuery(item.name);
            setIsManualInput(true);
            if (coords) setSourceLocation(coords);

            setActiveInput('dest');
            setSuggestions([]);
            setShowSuggestions(false);
        } else {
            setDestQuery(item.name);
            if (coords) setDestLocation(coords);

            setSuggestions([]);
            setShowSuggestions(false);
            setActiveInput(null);

            // Trigger Booking Mode ONLY if both locations exist
            // Use userPosition as fallback if sourceLocation hasn't synced yet but is available
            if ((sourceLocation || userPosition) && coords) {
                setRideStep('choose-ride');
            }
        }
    };

    const startBookingMode = () => {
        setRideStep('choose-ride');
    };

    const handleBackToSearch = () => {
        // 1. If we have an active booking state (Searching, Error, etc), reset it first
        if (bookingStatus !== 'IDLE') {
            handleCancelSearch(); // This resets status to IDLE and cancels ongoing listeners
            setIsPickupConfirmed(false); // Unlock the pin
            return;
        }

        // 2. Navigation Logic
        if (rideStep === 'confirm-pickup') {
            if (isPickupConfirmed) {
                setIsPickupConfirmed(false); // Go back to "Pin Adjustment" mode
            } else {
                setRideStep('choose-ride'); // Go back to "Vehicle Selection" mode
                // Re-fit bounds to route
                if (map && directions && directions.routes[0].bounds) {
                    map.fitBounds(directions.routes[0].bounds);
                }
            }
        } else {
            setRideStep('search');
            setDirections(null);
            setBookingStatus('IDLE');
        }
    };


    // Vehicles Data Refined
    const vehicles = [
        { id: 'mini', name: t('vehicles.mini'), img: MiniCar, price: '₹140', time: '4 min', capacity: 4 },
        { id: 'sedan', name: t('vehicles.sedan'), img: SedanCar, price: '₹185', time: '6 min', capacity: 4, badge: t('ride.standard') },
        { id: 'xl', name: t('vehicles.xl'), img: XLCar, price: '₹250', time: '9 min', capacity: 6 }
    ];

    const getVehicleDetails = (id) => vehicles.find(v => v.id === id);

    const handleConfirmBooking = async (locationOverride) => {
        console.log("[BOOKING] handleConfirmBooking called", locationOverride);
        const finalSourceLocation = locationOverride || sourceLocation;

        if (!finalSourceLocation) {
            console.error("[BOOKING] ERROR: No location found (override or state)");
            return;
        }
        if (!auth.currentUser) {
            console.error("[BOOKING] ERROR: No authenticated user");
            alert(t('ride.login_required'));
            return;
        }

        console.log("[RideScreen] Confirming booking with loc:", finalSourceLocation);
        haptics.success();
        setBookingStatus('SEARCHING');

        // 1. DATA PREP
        const selectedVehicleData = getVehicleDetails(selectedVehicle);
        const tripData = {
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || "User",
            userPhone: auth.currentUser.phoneNumber || "",
            pickup: {
                lat: finalSourceLocation.lat,
                lng: finalSourceLocation.lng,
                name: sourceQuery || t('common.current_location'), // User requested 'name'
                placeName: sourceQuery || t('common.current_location')
            },
            drop: destLocation ? {
                lat: destLocation.lat,
                lng: destLocation.lng,
                name: destQuery, // User requested 'name'
                placeName: destQuery
            } : null,
            distanceKm: directions?.routes[0]?.legs[0]?.distance?.value / 1000 || 0, // Approx
            etaMin: parseInt(selectedVehicleData.time) || 5,
            estimatedFare: parseInt(selectedVehicleData.price.replace('₹', '')),
            vehicleType: selectedVehicle
        };

        try {
            // 2. DISCOVER DRIVERS (Client-side Radius Filter)
            const onlineDrivers = await rideService.getOnlineDrivers(finalSourceLocation, 5);
            console.log(`[RideScreen] Online drivers found: ${onlineDrivers.length}`);

            // 3. CREATE TRIP
            const createdTrip = await rideService.createTrip(tripData);
            console.log(`[RideScreen] Trip created: ${createdTrip.tripId}`);
            setCurrentTrip(createdTrip);

            // 4. SEND REQUESTS
            const contactedDriverIds = onlineDrivers.map(d => d.id);
            await Promise.all(onlineDrivers.map(driver => {
                return rideService.sendRequestToDriver(driver.id, {
                    tripId: createdTrip.tripId,
                    pickup: tripData.pickup,
                    drop: tripData.drop,
                    distanceKm: tripData.distanceKm,
                    estimatedFare: tripData.estimatedFare,
                    userName: tripData.userName,
                    userPhone: tripData.userPhone,
                    etaMinutes: tripData.etaMin // User requested 'etaMinutes'
                });
            }));
            console.log(`[RideScreen] Requests dispatched to ${onlineDrivers.length} drivers.`);

            // 5. LISTEN FOR STATUS
            const unsubscribe = rideService.listenToTripStatus(createdTrip.tripId, (updatedTrip) => {
                if (!updatedTrip) return;
                console.log(`[RideScreen] Status Update detected: ${updatedTrip.status}`);

                if (updatedTrip.status === 'ACCEPTED' || updatedTrip.status === 'DRIVER_ACCEPTED') {
                    console.log("[RideScreen] Driver ACCEPTED!");
                    setBookingStatus('ACCEPTED');
                    setAssignedDriver({
                        id: updatedTrip.driverId,
                        name: updatedTrip.driverName || t('ride.driver'),
                        phone: updatedTrip.driverPhone,
                        vehicle: updatedTrip.vehicleDetails
                    });

                    // Start Listening to Driver Location
                    if (updatedTrip.driverId) {
                        if (driverLocationListenerRef.current) driverLocationListenerRef.current(); // cleanup old
                        driverLocationListenerRef.current = rideService.listenToDriverLocation(updatedTrip.driverId, (loc) => {
                            setDriverLocation(loc);
                        });
                    }

                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                } else if (updatedTrip.status === 'NO_DRIVER_FOUND') {
                    console.log("[RideScreen] NO_DRIVER_FOUND received.");
                    setBookingStatus('NO_DRIVER_FOUND');
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                } else if (updatedTrip.status === 'CANCELLED_BY_DRIVER') {
                    console.log("[RideScreen] CANCELLED_BY_DRIVER received.");
                    setBookingStatus('IDLE');
                    setDriverLocation(null);
                    setAssignedDriver(null);
                    alert(t('ride.driver_cancelled'));
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                }
            });
            tripListenerRef.current = unsubscribe;

            // 6. TIMEOUT LOGIC (30 Seconds)
            searchTimeoutRef.current = setTimeout(async () => {
                console.log("[RideScreen] Timeout - No driver accepted within 30s");
                await rideService.updateTripStatus(createdTrip.tripId, 'NO_DRIVER_FOUND');
                setBookingStatus('NO_DRIVER_FOUND');
                contactedDriverIds.forEach(did => {
                    rideService.deleteDriverRequest(did, createdTrip.tripId);
                });
            }, 30000);

        } catch (error) {
            console.error("[RideScreen] Critical Booking Error:", error);
            setBookingStatus('NO_DRIVER_FOUND');
        }
    };

    const handleCancelSearch = async () => {
        if (currentTrip) {
            await rideService.cancelTripByUser(currentTrip.tripId);
        }
        setBookingStatus('IDLE');
        if (tripListenerRef.current) tripListenerRef.current();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        if (driverLocationListenerRef.current) driverLocationListenerRef.current();
        setDriverLocation(null);
    };

    const handleRetry = () => {
        setBookingStatus('IDLE');
        setCurrentTrip(null);
        setDriverLocation(null);
    };

    // Cleanup Listener on Unmount or Cancel
    useEffect(() => {
        return () => {
            if (tripListenerRef.current) tripListenerRef.current();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (driverLocationListenerRef.current) driverLocationListenerRef.current();
        };
    }, []);

    // --- VIEW: BOOKING & CONFIRM MODE (REFECTORED) ---
    if (rideStep === 'choose-ride' || rideStep === 'confirm-pickup') {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 100 }}>
                {/* Full Screen Map */}
                <div style={{ position: 'absolute', inset: 0, paddingBottom: '300px' }}>
                    <Map
                        id="booking-map"
                        mapId="DEMO_MAP_ID"
                        center={isPickupConfirmed ? sourceLocation : undefined}
                        zoom={isPickupConfirmed ? 18 : undefined}
                        defaultCenter={sourceLocation || userPosition || DEFAULT_CENTER}
                        defaultZoom={15}
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        onCameraChanged={(ev) => {
                            if (!isPickupConfirmed) {
                                setMapCenter(ev.detail.center);
                            }
                        }}
                        onIdle={() => {
                            // ONLY update sourceLocation from map center in 'confirm-pickup' phase
                            // CRITICAL: Block updates if pickup is confirmed (Strict Lock)
                            if (mapCenter && !isPickupConfirmed && rideStep === 'confirm-pickup') {
                                setSourceLocation({ lat: mapCenter.lat, lng: mapCenter.lng });
                            }
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        {/* Fallback/Guide Polyline (Dashed) - Visible only if no valid route found, but HIDDEN in confirm-pickup */}
                        {sourceLocation && destLocation && !directions && rideStep !== 'confirm-pickup' && (
                            <Polyline
                                path={[sourceLocation, destLocation]}
                                options={{
                                    strokeColor: '#000000',
                                    strokeOpacity: 0,
                                    strokeWeight: 2,
                                    icons: [{
                                        icon: {
                                            path: 'M 0,-1 0,1',
                                            strokeOpacity: 0.5,
                                            scale: 3
                                        },
                                        offset: '0',
                                        repeat: '20px'
                                    }],
                                    clickable: false,
                                    draggable: false,
                                    geodesic: true
                                }}
                            />
                        )}

                        {/* Route Line (Visible ONLY in choose-ride for preview) */}
                        {directions && rideStep === 'choose-ride' && (
                            <CustomDirectionsRenderer directions={directions} />
                        )}

                        {/* Markers */}
                        {/* Pickup (SOURCE): Square Marker (Static on map during Cab Selection, Hidden during Confirm Pickup) */}
                        {sourceLocation && rideStep !== 'confirm-pickup' && (
                            <Marker
                                position={sourceLocation}
                                zIndex={100}
                                icon={{
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="6" y="6" width="20" height="20" rx="4" fill="black" stroke="white" stroke-width="3"/>
                                            <rect x="13" y="13" width="6" height="6" fill="white" />
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 32),
                                    anchor: new window.google.maps.Point(16, 16),
                                }}
                            />
                        )}

                        {/* Destination (DEST): Blue Square (Centered Anchor) - Hidden during pickup confirm */}
                        {destLocation && rideStep !== 'confirm-pickup' && (
                            <Marker
                                position={destLocation}
                                zIndex={100}
                                icon={{
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="6" y="6" width="20" height="20" rx="4" fill="#1569df" stroke="white" stroke-width="3" />
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 32),
                                    anchor: new window.google.maps.Point(16, 16),
                                }}
                            />
                        )}



                        {driverLocation && bookingStatus === 'ACCEPTED' && (
                            <AdvancedMarker position={driverLocation} zIndex={110}>
                                <div style={{
                                    width: 40, height: 40, background: 'white', borderRadius: '50%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transform: 'translateY(20px)'
                                }}>
                                    <img src={selectedVehicle === 'mini' ? MiniCar : (selectedVehicle === 'xl' ? XLCar : SedanCar)}
                                        style={{ width: 28, height: 'auto' }} alt="Driver" />
                                </div>
                            </AdvancedMarker>
                        )}

                        {/* Confirmed Pickup: Modern Lollipop Pin (Bottom Anchor) */}
                        {isPickupConfirmed && sourceLocation && (
                            <Marker
                                position={sourceLocation}
                                zIndex={150}
                                icon={{
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                        <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="16" cy="16" r="12" fill="black" />
                                            <rect x="13" y="13" width="6" height="6" fill="white" />
                                            <rect x="15" y="28" width="2" height="12" fill="black" />
                                            <circle cx="16" cy="44" r="3" fill="black" />
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(32, 48),
                                    anchor: new window.google.maps.Point(16, 48),
                                }}
                            />
                        )}
                    </Map>
                </div>

                {/* Adjust Pickup Overlay (Fixed Center Pin) - ONLY visible in confirm-pickup */}
                {rideStep === 'confirm-pickup' && !isPickupConfirmed && bookingStatus === 'IDLE' && (
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)',
                        zIndex: 50, pointerEvents: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: '32px'
                    }}>
                        {rideStep === 'confirm-pickup' && (
                            <div style={{ background: 'black', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                {t('ride.adjust_pickup') || "Adjust Pickup"}
                            </div>
                        )}
                        <motion.div
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <svg width="32" height="48" viewBox="0 0 32 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="16" cy="16" r="12" fill="black" />
                                <rect x="13" y="13" width="6" height="6" fill="white" />
                                <rect x="15" y="28" width="2" height="12" fill="black" />
                                <circle cx="16" cy="44" r="3" fill="black" />
                            </svg>
                        </motion.div>
                    </div>
                )}

                {/* Floating Controls */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: isRTL ? 'auto' : '16px',
                    left: isRTL ? '16px' : 'auto',
                    transform: 'translateY(-50%)',
                    display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10
                }}>
                    <button onClick={() => { if (map && directions && directions.routes[0].bounds) map.fitBounds(directions.routes[0].bounds); else if (map && userPosition) { map.panTo(userPosition); map.setZoom(15); } }} style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LocateFixed size={22} color="#374151" />
                    </button>
                </div>

                {/* Back Button */}
                <button
                    onClick={handleBackToSearch}
                    style={{
                        position: 'absolute', top: 50,
                        left: isRTL ? 'auto' : 16,
                        right: isRTL ? 16 : 'auto',
                        zIndex: 10,
                        border: 'none', background: 'white', borderRadius: '50%',
                        width: 44, height: 44,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                >
                    <ArrowLeft size={24} color="#374151" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </button>

                {/* UNIFIED RIDE BOTTOM SHEET */}
                <RideBottomSheet
                    sheetState={sheetState}
                    setSheetState={setSheetState}
                    footer={
                        <>
                            {rideStep === 'choose-ride' && (
                                <button
                                    onClick={() => { haptics.success(); setRideStep('confirm-pickup'); setSheetState('collapsed'); }}
                                    style={{ background: '#1569fd', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', width: '100%', fontSize: '16px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                >
                                    {t('ride.confirm_vehicle', { name: vehicles.find(v => v.id === selectedVehicle)?.name })}
                                </button>
                            )}
                            {rideStep === 'confirm-pickup' && bookingStatus === 'IDLE' && (
                                <button
                                    onClick={() => {
                                        let finalLoc = mapCenter || (map && { lat: map.getCenter().lat(), lng: map.getCenter().lng() }) || sourceLocation;
                                        if (finalLoc) {
                                            setIsPickupConfirmed(true);
                                            setSourceLocation(finalLoc);
                                            setTimeout(() => handleConfirmBooking(finalLoc), 800);
                                        }
                                    }}
                                    style={{ background: '#1569fd', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', width: '100%', fontSize: '16px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                                >
                                    {isPickupConfirmed ? t('ride.finalizing') : t('ride.confirm_pickup')}
                                </button>
                            )}
                            {/* Status Actions as Footer (Cancel, etc) */}
                            {bookingStatus === 'SEARCHING' && (
                                <button onClick={handleCancelSearch} style={{ marginTop: '0px', width: '100%', background: '#F3F4F6', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '600' }}>{t('ride.cancel')}</button>
                            )}
                            {bookingStatus === 'ACCEPTED' && assignedDriver && (
                                <button onClick={handleCancelSearch} style={{ width: '100%', background: '#EF4444', color: 'white', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '600' }}>{t('ride.cancel_ride')}</button>
                            )}
                            {bookingStatus === 'NO_DRIVER_FOUND' && (
                                <button onClick={handleRetry} style={{ marginTop: '0px', width: '100%', background: '#1569fd', color: 'white', padding: '16px', borderRadius: '12px', border: 'none' }}>{t('ride.retry')}</button>
                            )}
                        </>
                    }
                >
                    {rideStep === 'choose-ride' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', textAlign: 'center', margin: 0 }}>{t('ride.choose_trip')}</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {vehicles.map((v, index) => {
                                    const isSelected = selectedVehicle === v.id;
                                    return (
                                        <div
                                            key={v.id}
                                            onClick={() => { haptics.light(); setSelectedVehicle(v.id); }}
                                            style={{
                                                display: 'flex', alignItems: 'center', padding: '16px',
                                                borderRadius: '16px',
                                                border: isSelected ? '2px solid #000000' : '1px solid #F3F4F6',
                                                background: 'white', cursor: 'pointer',
                                            }}
                                        >
                                            <img src={v.img} alt={v.name} style={{ width: '60px', height: 'auto', marginRight: isRTL ? 0 : '16px', marginLeft: isRTL ? '16px' : 0 }} />
                                            <div style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                                                <div style={{ fontWeight: '600' }}>{v.name}</div>
                                                <div style={{ fontSize: '13px', color: '#6B7280' }}>{v.time.replace(' min', ' ' + t('common.min'))} • {t('ride.seats', { count: v.capacity })}</div>
                                            </div>
                                            <div style={{ fontWeight: 600 }}>{v.price}</div>
                                        </div>
                                    )
                                })}
                            </div>
                            {/* Button moved to footer */}
                        </div>
                    )}

                    {rideStep === 'confirm-pickup' && bookingStatus === 'IDLE' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{t('ride.confirm_pickup_spot') || "Set Pickup Location"}</h3>
                            <p style={{ color: '#6B7280', fontSize: '14px' }}>{t('ride.drag_map')}</p>
                            {/* Button moved to footer */}
                        </div>
                    )}

                    {/* STATUS OVERLAYS (Content) */}
                    {bookingStatus === 'SEARCHING' && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div className="flex justify-center mb-4">
                                <Loader2 className="animate-spin" size={48} />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>{t('ride.finding_drivers')}</h3>
                            {/* Cancel Button moved to footer */}
                        </div>
                    )}

                    {bookingStatus === 'ACCEPTED' && assignedDriver && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
                                <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>{t('ride.driver_on_way')}</h3>
                                    <p style={{ color: '#6B7280' }}>{t('ride.arriving_in', { eta: assignedDriver.eta || '5 min' })}</p>
                                </div>
                                <div style={{ background: '#000', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 600 }}>{t('ride.otp', { otp: '4921' })}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F9FAFB', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={24} /></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{assignedDriver.name}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{assignedDriver.vehicle}</div>
                                </div>
                                <a href={`tel:${assignedDriver.phone}`} style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={20} style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} /></a>
                            </div>
                            {/* Cancel Button moved to footer */}
                        </div>
                    )}

                    {bookingStatus === 'NO_DRIVER_FOUND' && (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>{t('ride.no_drivers_found')}</h3>
                            <p style={{ color: '#6B7280' }}>{t('ride.retry_later')}</p>
                            {/* Retry Button moved to footer */}
                        </div>
                    )}
                </RideBottomSheet>
            </div>
        );
    }



    // --- VIEW: SEARCH MODE ---
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: '#F9FAFB',
            padding: '24px',
            paddingTop: '60px', // Header space
            paddingBottom: '100px', // Nav space
            overflowY: 'auto'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* ... Header ... */}
                <header style={{ marginBottom: '32px', textAlign: isRTL ? 'right' : 'left' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                        {t('ride.title')}
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '15px' }}>
                        {t('ride.subtitle')}
                    </p>
                </header>

                <div style={{ padding: '0 4px', marginBottom: '24px' }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '20px 16px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        display: 'flex', flexDirection: 'row', alignItems: 'stretch'
                    }}>
                        {/* Timeline Visual */}
                        <div style={{
                            width: '24px', marginRight: '12px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            paddingTop: '6px', paddingBottom: '6px'
                        }}>
                            <div style={{ width: '8px', height: '8px', background: 'black', borderRadius: '50%', flexShrink: 0 }} />
                            <div style={{ flex: 1, width: '0px', borderLeft: '2px dotted #D1D5DB', margin: '4px 0' }} />
                            <ArrowDown size={14} color="#FACC15" strokeWidth={4} flexShrink={0} />
                        </div>

                        {/* Inputs */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Source */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px', position: 'relative' }}>
                                <Navigation size={18} color="#2563EB" fill="#2563EB" style={{ transform: 'rotate(45deg)', flexShrink: 0 }} />
                                <input
                                    ref={sourceInputRef}
                                    value={sourceQuery}
                                    onFocus={() => {
                                        setActiveInput('source');
                                        haptics.light();
                                        if (!isManualInput) {
                                            setSourceQuery('');
                                            setIsManualInput(true);
                                        }
                                    }}
                                    onChange={(e) => handleSearch(e.target.value, 'source')}
                                    placeholder={t('search.start_location')}
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                        fontSize: '16px',
                                        fontWeight: !isManualInput ? '400' : '600',
                                        color: !isManualInput ? '#2563EB' : '#111827',
                                        padding: 0, margin: 0,
                                        paddingInlineEnd: '40px',
                                        textAlign: isRTL ? 'right' : 'left',
                                        textOverflow: 'ellipsis'
                                    }}
                                />
                                <button onClick={() => { setIsManualInput(false); setSourceQuery(t('common.fetching_location')); }}
                                    style={{
                                        position: 'absolute',
                                        right: isRTL ? 'auto' : 0,
                                        left: isRTL ? 0 : 'auto',
                                        width: 32, height: 32, borderRadius: '50%', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}>
                                    {isResolvingLocation ? <Loader2 size={16} className="animate-spin" color="#3B82F6" /> : <LocateFixed size={18} color="#3B82F6" />}
                                </button>
                            </div>

                            <div style={{ height: 1, background: '#F3F4F6' }} />

                            {/* Destination */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                                <input
                                    value={destQuery}
                                    onFocus={() => { setActiveInput('dest'); haptics.light(); }}
                                    onChange={(e) => handleSearch(e.target.value, 'dest')}
                                    placeholder={t('search.where_to')}
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                        fontSize: '16px', fontWeight: '500', color: '#111827', padding: 0, margin: 0,
                                        textAlign: isRTL ? 'right' : 'left'
                                    }}
                                />
                                {destQuery && <button onClick={() => setDestQuery("")} style={{ border: 'none', background: 'none' }}><X size={18} color="#9CA3AF" /></button>}
                            </div>
                        </div>
                    </div>

                    {/* Suggestions */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                    background: 'white', borderRadius: '16px', marginTop: '12px', overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                                }}
                            >
                                {suggestions.map((item) => (
                                    <div key={item.id} onClick={() => handleSelect(item)} style={{ padding: '16px', display: 'flex', gap: '12px', borderBottom: '1px solid #F3F4F6' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={16} color="#4B5563" /></div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>{item.name}</div>
                                            <div style={{ fontSize: '13px', color: '#6B7280' }}>{item.subtitle}</div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default RideScreen;
