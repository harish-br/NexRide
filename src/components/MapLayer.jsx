import React, { useEffect, useState, useRef, useCallback } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, Marker } from '@vis.gl/react-google-maps';

const CameraHandler = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center) {
            map.panTo(center);
        }
    }, [map, center]);
    return null;
};

// ------------------------------------------
// Custom Polyline Component (Robust Ver.)
// ------------------------------------------
const Polyline = ({ path, options, onClick }) => {
    const map = useMap();
    const polylineRef = useRef(null);

    // Initial Create & Cleanup
    useEffect(() => {
        if (!map) return;

        // Create line
        const line = new window.google.maps.Polyline({
            path,
            clickable: !!onClick,
            map,
            ...options
        });

        polylineRef.current = line;

        // Event listener
        let listener = null;
        if (onClick) {
            listener = line.addListener('click', onClick);
        }

        return () => {
            if (listener) window.google.maps.event.removeListener(listener);
            line.setMap(null);
        };
    }, [map, path, onClick]); // Re-create if path changes

    // Update Options Dynamically
    useEffect(() => {
        if (polylineRef.current) {
            polylineRef.current.setOptions(options);
        }
    }, [options]);

    return null;
};

// ------------------------------------------
// Live Location Component
// ------------------------------------------
const LiveLocationMarker = ({ position }) => {
    const map = useMap();
    const markerRef = useRef(null);
    const accuracyCircleRef = useRef(null);

    const createBlueDotIcon = () => {
        if (!window.google || !window.google.maps) return null;
        const svgIcon = `
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="11" fill="#4285F4" stroke="white" stroke-width="3"/>
            </svg>
        `;
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
            scaledSize: new window.google.maps.Size(28, 28),
            anchor: new window.google.maps.Point(14, 14),
        };
    };

    useEffect(() => {
        return () => {
            if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
            if (accuracyCircleRef.current) { accuracyCircleRef.current.setMap(null); accuracyCircleRef.current = null; }
        };
    }, []);

    useEffect(() => {
        if (!map || !window.google || !window.google.maps || !position) return;
        const gMaps = window.google.maps;

        if (!markerRef.current) {
            const icon = createBlueDotIcon();
            if (!icon) return;
            markerRef.current = new gMaps.Marker({
                map, position, icon,
                zIndex: 1000, optimized: false, title: "Your location", clickable: false,
            });
        } else {
            markerRef.current.setPosition(position);
        }

        if (position.accuracy && position.accuracy > 0) {
            if (!accuracyCircleRef.current) {
                accuracyCircleRef.current = new gMaps.Circle({
                    map, center: position, radius: position.accuracy,
                    fillColor: "#4285F4", fillOpacity: 0.15, strokeColor: "#4285F4",
                    strokeOpacity: 0.3, strokeWeight: 1, zIndex: 100, clickable: false,
                });
            } else {
                accuracyCircleRef.current.setCenter(position);
                accuracyCircleRef.current.setRadius(position.accuracy);
            }
        }
    }, [map, position]);

    return null;
};

// ------------------------------------------
// Transit Marker Component (Circle Markers)
// ------------------------------------------
const TransitMarker = ({ position, type }) => {
    const map = useMap();
    const markerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
        };
    }, []);

    useEffect(() => {
        if (!map || !window.google || !position) return;
        const gMaps = window.google.maps;

        let svgIcon;
        let size;

        if (type === 'walk-start') {
            // White center, blue border circle
            svgIcon = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" fill="white" stroke="#3B82F6" stroke-width="3"/>
                    <circle cx="10" cy="10" r="3" fill="#3B82F6"/>
                </svg>
            `;
            size = 20;
        } else if (type === 'bus-stop') {
            // Green filled circle with bus icon
            svgIcon = `
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="14" cy="14" r="13" fill="#16A34A" stroke="white" stroke-width="2"/>
                    <path d="M9 9.5C9 8.67 9.67 8 10.5 8H17.5C18.33 8 19 8.67 19 9.5V17H9V9.5Z" fill="white" opacity="0.9"/>
                    <rect x="9" y="17" width="10" height="2" rx="0.5" fill="white" opacity="0.7"/>
                    <rect x="10" y="18.5" width="2.5" height="2.5" rx="1" fill="#16A34A"/>
                    <rect x="15.5" y="18.5" width="2.5" height="2.5" rx="1" fill="#16A34A"/>
                    <line x1="9" y1="13" x2="19" y2="13" stroke="#16A34A" stroke-width="1"/>
                </svg>
            `;
            size = 28;
        } else if (type === 'walk-end') {
            // Destination: blue square
            svgIcon = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="4" width="16" height="16" rx="4" fill="#1569df" stroke="white" stroke-width="2.5"/>
                    <rect x="9" y="9" width="6" height="6" rx="1" fill="white"/>
                </svg>
            `;
            size = 24;
        }

        const icon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
            scaledSize: new gMaps.Size(size, size),
            anchor: new gMaps.Point(size / 2, size / 2),
        };

        if (!markerRef.current) {
            markerRef.current = new gMaps.Marker({
                map, position, icon,
                zIndex: 200 + (type === 'bus-stop' ? 10 : 0),
                optimized: false, clickable: false,
            });
        } else {
            markerRef.current.setPosition(position);
        }
    }, [map, position, type]);

    return null;
};

// ------------------------------------------
// Animated Polyline with draw-on animation
// ------------------------------------------
const AnimatedPolyline = ({ path, options }) => {
    const map = useMap();
    const polylineRef = useRef(null);
    const animFrameRef = useRef(null);

    useEffect(() => {
        if (!map || !path || path.length < 2) return;

        // Cancel existing animation
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }

        const line = new window.google.maps.Polyline({
            path: [path[0]],
            map,
            ...options,
        });
        polylineRef.current = line;

        // Animate drawing
        const duration = 1000; // ms
        const start = performance.now();

        const animate = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const pointCount = Math.max(2, Math.floor(progress * path.length));
            line.setPath(path.slice(0, pointCount));
            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            }
        };
        animFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            line.setMap(null);
        };
    }, [map, path]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (polylineRef.current) {
            polylineRef.current.setOptions(options);
        }
    }, [options]);

    return null;
};

// ------------------------------------------
// Directions Handler (TRANSIT STYLE)
// ------------------------------------------
const Directions = ({ origin, destination, onRouteDetailsChange, selectedRouteIndex, onRouteIndexChange }) => {
    const map = useMap();
    const directionsService = useRef(null);
    const [directionsResult, setDirectionsResult] = useState(null);

    // 1. Fetch Route Data
    useEffect(() => {
        if (!map || !window.google) return;
        if (!directionsService.current) {
            directionsService.current = new window.google.maps.DirectionsService();
        }

        if (!origin || !destination) return;

        console.log("Directions: Fetching transit route...", { origin, destination });

        // Helper to extract location
        const getRequestLocation = (loc) => {
            if (typeof loc === 'string') return loc;
            if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
                return { lat: loc.lat, lng: loc.lng };
            }
            if (loc?.name) return loc.name;
            return loc;
        };

        const originReq = getRequestLocation(origin);
        const destReq = getRequestLocation(destination);

        directionsService.current.route(
            {
                origin: originReq,
                destination: destReq,
                travelMode: 'DRIVING',
                provideRouteAlternatives: true
            },
            (result, status) => {
                if (status === 'OK') {
                    console.log("Directions: Success", result);
                    setDirectionsResult(result);
                } else {
                    console.error("Directions: Failed", status);
                }
            }
        );
    }, [origin, destination, map]); // Re-fetch if inputs change

    // 2. Report Details for Selected Route
    useEffect(() => {
        if (directionsResult && directionsResult.routes[selectedRouteIndex]) {
            const leg = directionsResult.routes[selectedRouteIndex].legs[0];
            onRouteDetailsChange({
                distance: leg.distance.text,
                duration: leg.duration.text,
                summary: directionsResult.routes[selectedRouteIndex].summary
            });
        }
    }, [selectedRouteIndex, directionsResult, onRouteDetailsChange]);

    // 3. Fit Bounds
    useEffect(() => {
        if (map && directionsResult && directionsResult.routes[selectedRouteIndex]) {
            const route = directionsResult.routes[selectedRouteIndex];
            if (route.bounds) {
                map.fitBounds(route.bounds, {
                    bottom: 300, top: 100, left: 50, right: 50
                });
            }
        }
    }, [directionsResult, selectedRouteIndex, map]);

    const getEndLocation = () => directionsResult?.routes[selectedRouteIndex]?.legs[0]?.end_location;

    // 4. Determine style based on distance
    const getRouteOptions = (route) => {
        const distanceValue = route.legs[0].distance.value; // in meters
        
        if (distanceValue <= 2000) {
            // Short distance: Dotted blue walking path
            return {
                strokeColor: "#2563EB",
                strokeWeight: 4,
                strokeOpacity: 0,
                icons: [{
                    icon: {
                        path: "M 0,-1 0,1",
                        strokeOpacity: 1,
                        strokeColor: "#2563EB",
                        scale: 4
                    },
                    offset: "0",
                    repeat: "10px"
                }],
                zIndex: 15,
                geodesic: true
            };
        } else {
            // Long distance: Solid green transit line
            return {
                strokeColor: "#16A34A",
                strokeWeight: 6,
                strokeOpacity: 1,
                geodesic: true,
                lineCap: "round",
                zIndex: 15
            };
        }
    };

    // Inactive route style (grey, thin)
    const inactiveOptions = {
        strokeColor: '#9CA3AF',
        strokeWeight: 3,
        strokeOpacity: 0.35,
        zIndex: 5,
        geodesic: true,
    };

    return (
        <>
            {/* INACTIVE ROUTES (grey background) */}
            {directionsResult && directionsResult.routes.map((route, index) => {
                if (index === selectedRouteIndex) return null;
                return (
                    <Polyline
                        key={`inactive-${index}`}
                        path={route.overview_path}
                        onClick={() => onRouteIndexChange(index)}
                        options={inactiveOptions}
                    />
                );
            })}

            {/* ACTIVE ROUTE: Distance-based Style */}
            {directionsResult && directionsResult.routes[selectedRouteIndex] && (() => {
                const route = directionsResult.routes[selectedRouteIndex];
                const options = getRouteOptions(route);
                
                return (
                    <>
                        <AnimatedPolyline path={route.overview_path} options={options} />

                        {/* Start and End Markers */}
                        <TransitMarker position={route.legs[0].start_location} type="walk-start" />
                        <TransitMarker position={getEndLocation()} type="walk-end" />
                    </>
                );
            })()}
        </>
    );
};

// ------------------------------------------
// Train Component
// ------------------------------------------
const TrainMarker = ({ position, title }) => {
    const map = useMap();
    const markerRef = useRef(null);

    const createTrainIcon = () => {
        if (!window.google || !window.google.maps) return null;
        // Use a distinct icon (e.g., Orange/Red square or Train SVG)
        const svgIcon = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="white" stroke="#EA4335" stroke-width="2"/>
                <path d="M16 11V6H8V11C8 13.5 10 15 12 15C14 15 16 13.5 16 11ZM8 11H16" fill="#EA4335"/> 
                <path d="M12 1.5L12 3.5" stroke="#EA4335" stroke-width="2" stroke-linecap="round"/>
                <rect x="7" y="16" width="3" height="3" rx="1" fill="#333"/>
                <rect x="14" y="16" width="3" height="3" rx="1" fill="#333"/>
            </svg>
        `;
        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
            scaledSize: new window.google.maps.Size(32, 32),
            anchor: new window.google.maps.Point(16, 16),
        };
    };

    useEffect(() => {
        return () => {
            if (markerRef.current) { markerRef.current.setMap(null); markerRef.current = null; }
        };
    }, []);

    useEffect(() => {
        if (!map || !window.google || !position) return;
        const gMaps = window.google.maps;

        if (!markerRef.current) {
            const icon = createTrainIcon();
            markerRef.current = new gMaps.Marker({
                map, position, icon,
                zIndex: 2000, title: title || "Train", optimized: false
            });
        } else {
            markerRef.current.setPosition(position);
        }
    }, [map, position, title]);

    return null;
};

// ------------------------------------------
// Map Content & Container
// ------------------------------------------
const MapContent = ({ userPosition, routeData, onRouteDetailsChange, selectedRouteIndex, onRouteIndexChange, onStopSelect, recenterTrigger, onStopsFound, activeTrainLocation }) => {
    const map = useMap();
    const placesLibrary = useMapsLibrary('places');
    const placesService = useRef(null);
    const [nearbyStops, setNearbyStops] = useState([]);
    const lastFetchPos = useRef(null);
    const [isFollowing, setIsFollowing] = useState(true);

    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('dragstart', () => setIsFollowing(false));
        return () => window.google.maps.event.removeListener(listener);
    }, [map]);

    useEffect(() => {
        if (placesLibrary && map) placesService.current = new placesLibrary.PlacesService(map);
    }, [placesLibrary, map]);

    const fetchNearbyStops = useCallback((position) => {
        if (!placesService.current || !position || !window.google) return;
        placesService.current.nearbySearch({
            location: position, radius: 1500, type: ['bus_station', 'transit_station']
        }, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                const stops = results.map(stop => ({
                    ...stop,
                    distance: window.google.maps.geometry?.spherical?.computeDistanceBetween(
                        new window.google.maps.LatLng(position.lat, position.lng), stop.geometry.location
                    )
                })).sort((a, b) => a.distance - b.distance);
                setNearbyStops(stops);
                onStopsFound?.(stops.length);
            } else {
                onStopsFound?.(0);
            }
        });
    }, [onStopsFound]);

    const panToWithOffset = useCallback((targetPos) => {
        if (!map || !window.google) return;
        const projection = map.getProjection();
        if (!projection) { map.panTo(targetPos); return; }

        const pixelOffset = window.innerHeight * 0.23;
        const latLng = new window.google.maps.LatLng(targetPos.lat, targetPos.lng);
        const worldPoint = projection.fromLatLngToPoint(latLng);
        const scale = Math.pow(2, map.getZoom());
        const newWorldPoint = new window.google.maps.Point(worldPoint.x, worldPoint.y + pixelOffset / scale);
        map.panTo(projection.fromPointToLatLng(newWorldPoint));
    }, [map]);

    useEffect(() => {
        if (recenterTrigger > 0) {
            setTimeout(() => setIsFollowing(true), 0);
            if (userPosition) { map.setZoom(15); setTimeout(() => panToWithOffset(userPosition), 50); }
        }
        // PRIORITY: If we have a train location, follow IT, not the user.
        if (activeTrainLocation) {
            map.setZoom(13);
            map.panTo(activeTrainLocation);
            return;
        }

        if (userPosition && !routeData && isFollowing) {
            if (recenterTrigger === 0 && !lastFetchPos.current) map.setZoom(15);
            panToWithOffset(userPosition);
            fetchNearbyStops(userPosition);
        }
    }, [map, userPosition, recenterTrigger, fetchNearbyStops, routeData, isFollowing, panToWithOffset, activeTrainLocation]);

    useEffect(() => {
        if (userPosition && !lastFetchPos.current) lastFetchPos.current = userPosition;
    }, [userPosition]);

    if (!window.google || !window.google.maps) return null;

    return (
        <>
            {userPosition && <LiveLocationMarker position={userPosition} />}
            {activeTrainLocation && <TrainMarker position={activeTrainLocation} title={activeTrainLocation.title} />}

            {!routeData && nearbyStops.map(stop => (
                <Marker
                    key={stop.place_id} position={stop.geometry.location} title={stop.name}
                    onClick={() => onStopSelect && onStopSelect(stop)}
                    icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="22" r="16" fill="black" fill-opacity="0.2"/>
                                <circle cx="20" cy="20" r="16" fill="white"/>
                                <circle cx="20" cy="20" r="12" fill="#FBC02D"/> 
                                <path d="M16 14C16 12.9 16.9 12 18 12H22C23.1 12 24 12.9 24 14V23H16V14ZM16.5 24H18.5V25H16.5V24ZM21.5 24H23.5V25H21.5V24ZM15 22H25V14C25 12.34 23.66 11 22 11H18C16.34 11 15 12.34 15 14V22Z" fill="#202124"/>
                            </svg>
                        `),
                        scaledSize: new window.google.maps.Size(40, 40),
                        anchor: new window.google.maps.Point(20, 20),
                    }}
                />
            ))}
            {routeData && (
                <Directions
                    origin={routeData.origin} destination={routeData.destination}
                    onRouteDetailsChange={onRouteDetailsChange}
                    selectedRouteIndex={selectedRouteIndex}
                    onRouteIndexChange={onRouteIndexChange}
                />
            )}
        </>
    );
};

const MapLayer = ({ isSheetOpen, isDragging, activeScreen, routeData, onRouteDetailsChange, selectedRouteIndex, onRouteIndexChange, onStopSelect, recenterTrigger, onStopsFound, userPosition, activeTrainLocation }) => {
    const defaultPosition = { lat: 11.3410, lng: 77.7172 };
    const gesturesEnabled = !isSheetOpen && !isDragging && activeScreen !== 'search';

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <Map
                defaultCenter={defaultPosition} defaultZoom={15}
                disableDefaultUI={true} clickableIcons={false}
                gestureHandling={gesturesEnabled ? 'greedy' : 'none'}
                style={{ width: '100%', height: '100%' }}
            >
                <MapContent
                    userPosition={userPosition} routeData={routeData}
                    onRouteDetailsChange={onRouteDetailsChange}
                    selectedRouteIndex={selectedRouteIndex}
                    onRouteIndexChange={onRouteIndexChange}
                    onStopSelect={onStopSelect}
                    recenterTrigger={recenterTrigger}
                    onStopsFound={onStopsFound}
                    activeTrainLocation={activeTrainLocation}
                />
            </Map>
        </div>
    );
};

export default MapLayer;
