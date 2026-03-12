import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { ArrowLeft, MapPin, Navigation2, Bus, Footprints, Loader2, Locate } from 'lucide-react';
import haptics from '../utils/haptics';
import { getDistance } from '../utils/locationUtils';

// Modular cache to prevent hitting Quota limits if user
// clicks back and forth between the same stop rapidly.
const routeCache = {};

// ─── Map Overlay: Markers + Polyline ─────────────────────────
const MapOverlay = ({ userPosition, stop, setRouteInfo, setIsLoadingRoute }) => {
    const map = useMap();
    const markerLibrary = useMapsLibrary('marker');
    const polylineRef = useRef(null);
    const userMarkerRef = useRef(null);
    const stopMarkerRef = useRef(null);
    const markerDivRef = useRef(null);
    const hasFittedRef = useRef(false);

    const [zoomLevel, setZoomLevel] = useState(15);

    // Track map zoom
    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('zoom_changed', () => {
            setZoomLevel(map.getZoom() || 15);
        });
        setZoomLevel(map.getZoom() || 15);
        return () => window.google.maps.event.removeListener(listener);
    }, [map]);

    const cleanup = useCallback(() => {
        if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
        if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
        if (stopMarkerRef.current) { stopMarkerRef.current.setMap(null); stopMarkerRef.current = null; }
    }, []);

    useEffect(() => {
        if (!map || !window.google || !window.google.maps || !markerLibrary) return;

        cleanup();
        const gm = window.google.maps;

        // ── User Location Marker (Pulsing Blue Dot) ──
        userMarkerRef.current = new gm.Marker({
            position: { lat: userPosition.lat, lng: userPosition.lng },
            map,
            title: 'Your Location',
            icon: {
                url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="13" fill="#4285F4" fill-opacity="0.15" stroke="#4285F4" stroke-width="1.5"/>
            <circle cx="14" cy="14" r="7" fill="#4285F4" stroke="#fff" stroke-width="2.5"/>
          </svg>
        `),
                scaledSize: new gm.Size(28, 28),
                anchor: new gm.Point(14, 14),
            },
            zIndex: 999,
        });

        // ── Bus Stop Marker (Custom DOM-based AdvancedMarkerElement) ──
        const markerDiv = document.createElement('div');
        markerDivRef.current = markerDiv;

        markerDiv.className = 'custom-bus-stop-marker';
        markerDiv.style.width = '64px';
        markerDiv.style.height = '64px';
        markerDiv.style.backgroundColor = '#ffffff';
        // Primary Blue stroke for selected state
        markerDiv.style.border = '3px solid #2563EB';
        markerDiv.style.borderRadius = '50%';
        markerDiv.style.display = 'flex';
        markerDiv.style.alignItems = 'center';
        markerDiv.style.justifyContent = 'center';
        // Pulse animation since it is the selected stop
        markerDiv.style.animation = 'markerPulse 2s infinite';
        markerDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        markerDiv.style.cursor = 'pointer';
        markerDiv.style.transition = 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        markerDiv.style.transformOrigin = 'center';

        // Ensure accessibility
        markerDiv.setAttribute('aria-label', `Bus stop location – ${stop.name}`);
        markerDiv.setAttribute('role', 'button');

        // Image tag pointing to the user's custom bus stop icon 
        markerDiv.innerHTML = `
            <img src="/bus-stop-icon.png" width="32" height="32" style="object-fit: contain; border-radius: 4px;" alt="Bus Stop" />
        `;

        // Add hover & active interactions via JS events directly on the element
        markerDiv.addEventListener('mouseenter', () => {
            markerDiv.style.transform = 'scale(1.15)';
            markerDiv.style.borderColor = '#1D4ED8';
            markerDiv.style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
        });
        markerDiv.addEventListener('mouseleave', () => {
            markerDiv.style.transform = 'scale(1)';
            markerDiv.style.borderColor = '#2563EB';
            markerDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        });
        markerDiv.addEventListener('mousedown', () => {
            markerDiv.style.transform = 'scale(0.95)';
        });
        markerDiv.addEventListener('mouseup', () => {
            markerDiv.style.transform = 'scale(1.15)';
            haptics.light();
        });

        // Instantiate the Advanced Marker
        stopMarkerRef.current = new markerLibrary.AdvancedMarkerElement({
            position: { lat: stop.latitude, lng: stop.longitude },
            map,
            title: stop.name,
            content: markerDiv,
            zIndex: 1000,
        });

        const drawFallbackLine = () => {
            const path = [
                { lat: userPosition.lat, lng: userPosition.lng },
                { lat: stop.latitude, lng: stop.longitude },
            ];

            polylineRef.current = new gm.Polyline({
                path,
                geodesic: true,
                strokeColor: '#1A73E8',
                strokeOpacity: 0,
                strokeWeight: 0,
                icons: [{
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#1A73E8', strokeWeight: 4, scale: 3 },
                    offset: '0',
                    repeat: '16px',
                }],
                map,
            });

            const bounds = new gm.LatLngBounds();
            bounds.extend(path[0]);
            bounds.extend(path[1]);
            map.fitBounds(bounds, { top: 120, bottom: 280, left: 50, right: 50 });

            // Clear loading and info state to use fallback Haversine distance
            setIsLoadingRoute(false);
            setRouteInfo(null);
        };

        const drawDirectionsRoute = async () => {
            const cacheKey = `${userPosition.lat},${userPosition.lng}-${stop.latitude},${stop.longitude}`;

            let routeResult = routeCache[cacheKey];

            if (!routeResult) {
                setIsLoadingRoute(true);
                const directionsService = new gm.DirectionsService();

                try {
                    routeResult = await new Promise((resolve, reject) => {
                        directionsService.route({
                            origin: { lat: userPosition.lat, lng: userPosition.lng },
                            destination: { lat: stop.latitude, lng: stop.longitude },
                            travelMode: gm.TravelMode.WALKING
                        }, (response, status) => {
                            if (status === gm.DirectionsStatus.OK) resolve(response);
                            else reject(status);
                        });
                    });

                    // Cache for future clicks
                    routeCache[cacheKey] = routeResult;
                } catch (err) {
                    console.error("Directions API failed:", err);
                    drawFallbackLine();
                    return;
                }
            }

            const route = routeResult.routes[0];
            const leg = route.legs[0];

            polylineRef.current = new gm.Polyline({
                path: route.overview_path,
                geodesic: true,
                strokeColor: '#2563EB',
                strokeOpacity: 0.9,
                strokeWeight: 4,
                map,
            });

            // Adjust bounds exactly to the route
            map.fitBounds(route.bounds, { top: 120, bottom: 280, left: 50, right: 50 });

            setRouteInfo({
                distance: leg.distance.text,
                duration: leg.duration.text
            });

            setIsLoadingRoute(false);
        };

        const dist = getDistance(
            userPosition.lat, userPosition.lng,
            stop.latitude, stop.longitude
        );

        if (dist < 30) {
            // ── Very close stop: skip Directions API ──
            const simplePath = [
                { lat: userPosition.lat, lng: userPosition.lng },
                { lat: stop.latitude, lng: stop.longitude },
            ];

            polylineRef.current = new gm.Polyline({
                path: simplePath,
                geodesic: true,
                strokeColor: '#2563EB',
                strokeOpacity: 0.9,
                strokeWeight: 5,
                map,
            });

            map.setCenter({ lat: stop.latitude, lng: stop.longitude });
            map.setZoom(18);

            setIsLoadingRoute(false);
            setRouteInfo(null); // fallback Haversine values used in UI
        } else {
            drawDirectionsRoute();
        }


        return cleanup;
    }, [map, markerLibrary, userPosition.lat, userPosition.lng, stop.latitude, stop.longitude, cleanup, setRouteInfo, setIsLoadingRoute]);

    // Track responsive map zooming to scale the marker properly to avoid clutter
    useEffect(() => {
        if (!markerDivRef.current) return;
        const div = markerDivRef.current;
        const img = div.querySelector('img');

        let size = 64;
        let iconSize = 32;

        if (zoomLevel > 16) {
            size = 64;
            iconSize = 32;
        } else if (zoomLevel >= 13) {
            size = 52;
            iconSize = 26;
        } else {
            size = 44;
            iconSize = 22;
        }

        div.style.width = size + 'px';
        div.style.height = size + 'px';
        if (img) {
            img.setAttribute('width', iconSize);
            img.setAttribute('height', iconSize);
        }
    }, [zoomLevel]);

    return null;
};

// ─── Main Map Screen ─────────────────────────────────────────
const NearbyStopMapScreen = ({ userPosition, stop, onBack }) => {
    const [mapReady, setMapReady] = useState(false);
    const [isLoadingRoute, setIsLoadingRoute] = useState(true);
    const [routeInfo, setRouteInfo] = useState(null);

    // Fallback Haversine parameters
    const distanceFallback = useMemo(() => {
        if (!userPosition || !stop) return 0;
        return getDistance(userPosition.lat, userPosition.lng, stop.latitude, stop.longitude);
    }, [userPosition, stop]);

    const formatDist = (m) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);
    const walkTimeFallback = Math.ceil(distanceFallback / 80);
    const walkTimeLabelFallback = walkTimeFallback >= 60
        ? `${Math.floor(walkTimeFallback / 60)} hr ${walkTimeFallback % 60} min`
        : `${walkTimeFallback} min`;

    // Final displayed values
    const primaryDistance = routeInfo ? routeInfo.distance : formatDist(distanceFallback);
    const primaryTime = routeInfo ? `~${routeInfo.duration} ` : `~${walkTimeLabelFallback} `;

    if (!stop || !userPosition) return null;

    const center = {
        lat: (userPosition.lat + stop.latitude) / 2,
        lng: (userPosition.lng + stop.longitude) / 2,
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 110,
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Global style for map marker pulse animation */}
            <style>{`
        @keyframes markerPulse {
            0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
            70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
`}</style>

            {/* Map */}
            <div style={{ flex: 1, position: 'relative' }}>
                <Map
                    defaultCenter={center}
                    defaultZoom={14}
                    mapId="nearby-stop-map"
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    style={{ width: '100%', height: '100%' }}
                    onTilesLoaded={() => setMapReady(true)}
                >
                    {mapReady && (
                        <MapOverlay
                            userPosition={userPosition}
                            stop={stop}
                            setRouteInfo={setRouteInfo}
                            setIsLoadingRoute={setIsLoadingRoute}
                        />
                    )}
                </Map>

                {/* Loading Indicator */}
                <AnimatePresence>
                    {isLoadingRoute && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                padding: '12px 20px',
                                borderRadius: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 12, // Ensure it's above map elements
                                pointerEvents: 'none',
                            }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            >
                                <Loader2 size={18} color="#2563EB" />
                            </motion.div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                                Finding walking route...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back Button */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                        haptics.light();
                        onBack();
                    }}
                    style={{
                        position: 'absolute',
                        top: '52px',
                        left: '16px',
                        background: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                        zIndex: 10,
                    }}
                >
                    <ArrowLeft size={22} color="#111" />
                </motion.button>

                {/* Distance Chip (floating on map) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        position: 'absolute',
                        top: '56px',
                        right: '16px',
                        background: '#fff',
                        borderRadius: '20px',
                        padding: '8px 14px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        zIndex: 10,
                    }}
                >
                    <MapPin size={14} color="#1A73E8" strokeWidth={2.5} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1A73E8' }}>
                        {primaryDistance}
                    </span>
                </motion.div>
            </div>

            {/* Bottom Info Card */}
            <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                    background: '#fff',
                    borderTopLeftRadius: '22px',
                    borderTopRightRadius: '22px',
                    padding: '16px 20px 36px',
                    boxShadow: '0 -8px 20px rgba(0,0,0,0.08)',
                }}
            >
                {/* Drag Indicator */}
                <div style={{
                    width: '40px',
                    height: '4px',
                    borderRadius: '999px',
                    background: '#D1D5DB',
                    margin: '0 auto 16px',
                }} />

                {/* Stop Name + Icon */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                    }}>
                        <img 
                            src="/icons/nearby_bus_stop_3d_new.png" 
                            alt="Nearby" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#111827',
                            lineHeight: 1.3,
                        }}>
                            {stop.name}
                        </h2>
                        <p style={{
                            margin: '2px 0 0',
                            fontSize: '14px',
                            color: '#6B7280',
                            fontWeight: 500,
                        }}>{stop.type ? stop.type : 'Bus Stop'}</p>
                    </div>
                </div>

                {/* Walk Card */}
                <div style={{
                    background: '#F8FAFC',
                    borderRadius: '14px',
                    padding: '14px',
                    width: '110px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="22" height="22">
                        <g fill="#111827" transform="scale(5.33333,5.33333)">
                            <path d="M26.5,5c-1.933,0 -3.5,1.567 -3.5,3.5c0,1.933 1.567,3.5 3.5,3.5c1.933,0 3.5,-1.567 3.5,-3.5c0,-1.933 -1.567,-3.5 -3.5,-3.5zM22.59766,12.98633c-0.38233,-0.01368 -0.76056,0.08257 -1.08984,0.27734l-7,4c-0.54169,0.30958 -0.9079,0.8542 -0.99023,1.47266l-1,7.5c-0.10815,0.715 0.17805,1.4327 0.74852,1.87708c0.57047,0.44439 1.33638,0.54626 2.00318,0.26643c0.6668,-0.27982 1.13064,-0.89776 1.21314,-1.61617l0.86914,-6.51758l3.05664,-1.74609c-0.41659,2.16263 -0.84275,4.36902 -0.93945,4.87109c-0.01311,0.04192 -0.02483,0.08426 -0.03516,0.12695l-3.23242,12.47266l-5.11523,5.11523c-0.52248,0.50163 -0.73295,1.24653 -0.55024,1.94742c0.18271,0.70088 0.73006,1.24823 1.43094,1.43094c0.70088,0.18271 1.44578,-0.02776 1.94742,-0.55024l5.5,-5.5c0.22296,-0.2241 0.38962,-0.49786 0.48633,-0.79883l0.00195,0.00781l2.85938,-5.62305l3.85352,5l3.04688,6.28711c0.26712,0.67781 0.88166,1.15677 1.60417,1.25027c0.72252,0.09351 1.43874,-0.21322 1.86961,-0.80069c0.43088,-0.58747 0.50826,-1.36275 0.202,-2.0238l-3,-7c-0.03548,-0.08342 -0.07659,-0.16434 -0.12305,-0.24219l-4.97852,-8.29687c0.12099,-0.42346 0.76721,-2.68809 1.31055,-4.58984l1.66602,3.31445c0.20513,0.4077 0.54351,0.73299 0.95898,0.92187l5.5,2.5c0.65291,0.31229 1.42359,0.24751 2.01521,-0.16938c0.59162,-0.4169 0.91188,-1.12087 0.83744,-1.84078c-0.07445,-0.71991 -0.53199,-1.34345 -1.1964,-1.63046l-4.85742,-2.20898l-3.95508,-7.86914c-0.15798,-0.32321 -0.40021,-0.59782 -0.70117,-0.79492c-0.58725,-0.51086 -1.34164,-0.80664 -2.13477,-0.80664h-1.92773c-0.05124,-0.00655 -0.10271,-0.01111 -0.1543,-0.01367z" />
                        </g>
                    </svg>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                        {primaryDistance}
                    </span>
                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                        {primaryTime}
                    </span>
                </div>
            </motion.div >
        </motion.div >
    );
};

export default NearbyStopMapScreen;
