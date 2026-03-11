import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { ArrowLeft, MapPin, Navigation2, Bus, Footprints, Loader2 } from 'lucide-react';
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

        drawDirectionsRoute();

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
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <MapPin size={18} color="#2563EB" strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '20px',
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

                {/* Stats Row */}
                <div style={{
                    display: 'flex',
                    gap: '14px',
                    marginBottom: '18px',
                }}>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#F8FAFC',
                        padding: '12px 14px',
                        borderRadius: '12px',
                    }}>
                        <MapPin size={22} color="#6B7280" strokeWidth={1.8} />
                        <div>
                            <span style={{ display: 'block', fontSize: '13px', color: '#6B7280', fontWeight: 500, marginBottom: '2px' }}>Distance</span>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                                {primaryDistance}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: '#F8FAFC',
                        padding: '12px 14px',
                        borderRadius: '12px',
                    }}>
                        <Footprints size={22} color="#6B7280" strokeWidth={1.8} />
                        <div>
                            <span style={{ display: 'block', fontSize: '13px', color: '#6B7280', fontWeight: 500, marginBottom: '2px' }}>Walking</span>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                                {primaryTime}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigate Button */}
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        haptics.medium();
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}&travelmode=walking`;
                        window.open(url, '_blank');
                    }}
                    style={{
                        width: '100%',
                        height: '48px',
                        background: 'linear-gradient(90deg, #2563EB, #1D4ED8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '16px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 6px 14px rgba(37,99,235,0.25)',
                    }}
                >
                    <Navigation2 size={18} fill="white" strokeWidth={0} />
                    Navigate to Stop
                </motion.button>
            </motion.div >
        </motion.div >
    );
};

export default NearbyStopMapScreen;
