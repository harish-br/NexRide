import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, LocateFixed, Search, MapPin, Loader2, Check } from 'lucide-react';
import { Map, useMap } from '@vis.gl/react-google-maps';
import haptics from '../utils/haptics';

const API_KEY = "AIzaSyDlpxJyvl6FFHQGVO3_i-FsTO_-L9GlLO8";

const MapController = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (map && center && center.forcePan) {
            map.panTo(center);
        }
    }, [map, center]);
    return null;
};

const SetLocationScreen = ({ onClose, onSave, type, initialLocation }) => {
    
    const defaultLocation = initialLocation || { lat: 11.3410, lng: 77.7172 };
    
    const [center, setCenter] = useState({ ...defaultLocation, forcePan: true });
    const [address, setAddress] = useState('Fetching address...');
    const [isResolving, setIsResolving] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [addressError, setAddressError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const debounceTimeout = useRef(null);

    const getTitle = () => {
        if (type === 'home') return 'Set Home Location';
        if (type === 'work') return 'Set Work Location';
        return 'Add New Place';
    };

    const reverseGeocode = async (lat, lng, retryCount = 0) => {
        setIsResolving(true);
        setAddressError(false);
        console.log(`[Geocode] Staring reverse geocode for Lat: ${lat}, Lng: ${lng}`);

        if (!navigator.onLine) {
            setAddress("Offline. Connect to internet to search.");
            setAddressError(true);
            setIsResolving(false);
            setIsMoving(false);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            
            console.log("[Geocode] Status:", data.status);

            if (data.status === 'REQUEST_DENIED') {
                 console.error("[Geocode] API Key is missing permissions/billing!");
            }

            if (data.results && data.results.length > 0) {
                const comps = data.results[0].address_components;
                const neighborhood = comps?.find(c => c.types.includes("sublocality_level_1"))?.long_name;
                const area = comps?.find(c => c.types.includes("sublocality_level_2"))?.long_name;
                const street = comps?.find(c => c.types.includes("route"))?.long_name;
                const locality = comps?.find(c => c.types.includes("locality"))?.long_name;

                let addr = neighborhood || area || street || locality || data.results[0].formatted_address.split(',')[0];
                if (locality && addr !== locality) {
                    addr += `, ${locality}`;
                }
                setAddress(data.results[0].formatted_address);
                setAddressError(false);
                console.log("[Geocode] Resolved Address:", data.results[0].formatted_address);
            } else {
                setAddress("Unknown location");
                setAddressError(true);
                console.log("[Geocode] No results found");
            }
        } catch (err) {
            console.error("[Geocode] Failed to load address", err);
            if (retryCount < 1 && err.name !== 'AbortError') {
                console.log("[Geocode] Retrying...");
                setTimeout(() => reverseGeocode(lat, lng, 1), 1000);
                return;
            }
            setAddress("Unable to fetch location. Tap here to retry.");
            setAddressError(true);
        } finally {
            setIsResolving(false);
            setIsMoving(false); // Safety reset
        }
    };

    const fetchCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setIsResolving(true);
            setAddress("Locating you...");
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude, forcePan: true };
                    setCenter(newCenter);
                    reverseGeocode(newCenter.lat, newCenter.lng);
                },
                (err) => {
                    console.error("[GPS] Permission denied or failed", err);
                    setAddress("Location permission denied.");
                    setAddressError(true);
                    setIsResolving(false);
                    // Fallback to default/initial
                    reverseGeocode(center.lat, center.lng);
                    setTimeout(() => alert("Please enable Location Services to use your current location."), 500);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            reverseGeocode(center.lat, center.lng);
        }
    };

    useEffect(() => {
        if (!initialLocation) {
            fetchCurrentLocation();
        } else {
            reverseGeocode(center.lat, center.lng);
        }
    }, []);

    // Smart Auto-Refetch System on Re-connection
    useEffect(() => {
        let retryCount = 1;
        const retryFetch = () => {
            if (retryCount <= 0) return;
            setTimeout(() => {
                if (!navigator.onLine) return;
                console.log(`[Network] Auto-retrying fetch... Attempts left: ${retryCount}`);
                if (!initialLocation) fetchCurrentLocation();
                else reverseGeocode(center.lat, center.lng);
                retryCount--;
            }, 2000); // 2 second delay on reconnect to allow network to stabilize
        };

        const handleOnline = () => {
            if (addressError || !address || address.includes("Offline")) {
                console.log("[Network] Connection restored. Triggering smart refetch.");
                retryCount = 3; // allow 3 retries
                retryFetch();
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('app:manualRefresh', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('app:manualRefresh', handleOnline);
        };
    }, [addressError, address, center]);

    const fetchSuggestions = async (input) => {
        if (!input || input.length < 2) return;
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

            if (!response.ok) throw new Error('API failed');
            const data = await response.json();

            if (data.suggestions) {
                const formatted = data.suggestions.map(s => {
                    const placePrediction = s.placePrediction;
                    return {
                        id: placePrediction.placeId,
                        name: placePrediction.structuredFormat?.mainText?.text,
                        subtitle: placePrediction.structuredFormat?.secondaryText?.text
                    };
                });
                setSuggestions(formatted);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            setSuggestions([]);
        }
    };

    const handleSearchChange = (val) => {
        setSearchQuery(val);
        if (val.length < 2) {
            setSuggestions([]);
            return;
        }
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 300);
    };

    const handleSelectSuggestion = async (item) => {
        haptics.light();
        setSearchQuery('');
        setSuggestions([]);
        
        try {
            const response = await fetch(`https://places.googleapis.com/v1/places/${item.id}?fields=location&key=${API_KEY}`);
            const data = await response.json();
            if (data.location) {
                const newCenter = { lat: data.location.latitude, lng: data.location.longitude, forcePan: true };
                setCenter(newCenter);
                reverseGeocode(newCenter.lat, newCenter.lng);
            }
        } catch (err) {
            console.error("Error fetching place details:", err);
        }
    };

    // Use a ref for debouncing
    const geocodeTimeout = useRef(null);

    const handleLocationChange = useCallback((lat, lng) => {
        setIsMoving(false);
        setCenter({ lat, lng, forcePan: false });

        if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
        
        geocodeTimeout.current = setTimeout(() => {
            reverseGeocode(lat, lng);
        }, 500); // 500ms debounce
    }, [reverseGeocode]);

    const handleDragStart = useCallback(() => {
        setIsMoving(true);
        if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    }, []);

    // Custom component to safely bind native map events
    const MapEventsHandler = ({ onIdle, onDragStart }) => {
        const map = useMap();
        
        useEffect(() => {
            if (!map || !window.google) return;
            
            const idleListener = map.addListener("idle", () => {
                const center = map.getCenter();
                if (center) {
                    onIdle(center.lat(), center.lng());
                }
            });

            const dragListener = map.addListener("dragstart", () => {
                onDragStart();
            });

            const dragListener2 = map.addListener("center_changed", () => {
                 // Optionally mark as moving if center changes programmatically
                 // Or we rely purely on map bounds.
            });

            return () => {
                window.google.maps.event.removeListener(idleListener);
                window.google.maps.event.removeListener(dragListener);
                window.google.maps.event.removeListener(dragListener2);
            };
        }, [map, onIdle, onDragStart]);

        return null;
    };

    return (
        <div className="location-screen-container" style={{
            position: 'absolute', inset: 0, zIndex: 1000, 
            background: '#F5F6FA', display: 'flex', flexDirection: 'column'
        }}>
            {/* TOP BAR / SEARCH */}
            <div className="header" style={{ 
                background: '#fff', padding: '24px 20px 16px', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', zIndex: 10 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <button onClick={() => { haptics.light(); onClose(); }} style={{
                        background: 'rgba(21,105,253,0.08)', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s', cursor: 'pointer'
                    }}>
                        <ArrowLeft size={20} color="#1569FD" />
                    </button>
                    <h2 style={{ fontSize: '19px', fontWeight: 700, margin: 0, color: '#111827' }}>{getTitle()}</h2>
                </div>

                <div style={{ position: 'relative' }}>
                    <div className="search-bar" style={{ 
                        display: 'flex', alignItems: 'center', background: '#F9FAFB', 
                        borderRadius: '14px', padding: '14px 16px',
                        border: '1.5px solid transparent', transition: 'all 0.2s ease'
                    }}>
                        <Search size={18} color="#1569FD" style={{ flexShrink: 0 }} />
                        <input
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Search area or building..."
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', marginLeft: '10px', fontSize: '15.5px', color: '#111', fontWeight: 500 }}
                        />
                    </div>

                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 10px)', left: 0, right: 0,
                            background: 'white', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                            maxHeight: '260px', overflowY: 'auto', zIndex: 20,
                            border: '1px solid #F3F4F6'
                        }}>
                            {suggestions.map((item, idx) => (
                                <div 
                                    key={item.id} onClick={() => handleSelectSuggestion(item)}
                                    style={{ 
                                        padding: '16px', display: 'flex', alignItems: 'center', gap: '14px',
                                        borderBottom: idx < suggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                                        cursor: 'pointer', transition: 'background 0.2s',
                                    }}
                                    onMouseDown={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                    onMouseUp={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(21,105,253,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MapPin size={18} color="#1569FD" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15.5px', fontWeight: 600, color: '#111' }}>{item.name}</div>
                                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '3px' }}>{item.subtitle}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MAP SECTION */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <Map
                    defaultCenter={{ lat: 11.3410, lng: 77.7172 }}
                    defaultZoom={16}
                    disableDefaultUI={true}
                    gestureHandling="greedy"
                    style={{ width: '100%', height: '100%' }}
                >
                    <MapEventsHandler onIdle={handleLocationChange} onDragStart={handleDragStart} />
                    <MapController center={center} />
                </Map>
                
                {/* FIXED CENTER PIN UI */}
                <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: isMoving ? 'translate(-50%, -120%)' : 'translate(-50%, -100%)',
                    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    zIndex: 2
                }}>
                    <div className="pin-label" style={{ 
                        background: '#1569FD', color: 'white', padding: '8px 14px', 
                        borderRadius: '24px', fontSize: '13px', fontWeight: 600,
                        marginBottom: '10px', boxShadow: '0 6px 16px rgba(21,105,253,0.3)',
                        whiteSpace: 'nowrap',
                        transform: isMoving ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.2s ease'
                    }}>
                        {isMoving ? 'Move map to adjust' : 'Set Location Here'}
                    </div>
                    {/* Map marker SVG custom pin */}
                    <div style={{ position: 'relative' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.25))' }}>
                            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#1569FD" stroke="white" strokeWidth="2"/>
                            <circle cx="12" cy="9" r="3.5" fill="white"/>
                        </svg>
                        {/* Shadow beneath pin */}
                        <div style={{ 
                            position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)',
                            width: '12px', height: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%',
                            filter: 'blur(2px)', opacity: isMoving ? 0.3 : 0.8, transition: 'opacity 0.2s'
                        }} />
                    </div>
                </div>

                {/* LOCATE ME BUTTON */}
                <button 
                    onClick={() => {
                        haptics.light();
                        fetchCurrentLocation();
                    }}
                    className="location-btn"
                    style={{
                        position: 'absolute', bottom: '32px', right: '20px',
                        width: '48px', height: '48px', borderRadius: '50%', 
                        background: 'rgba(21,105,253,0.1)', color: '#1569FD',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', border: '1.5px solid white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(8px)', transition: 'transform 0.2s'
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <LocateFixed size={22} color="#1569FD" />
                </button>
            </div>

            {/* BOTTOM CONFIRMATION SHEET */}
            <div className="bottom-sheet" style={{
                background: 'white', padding: '24px', paddingBottom: '36px',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.08)', zIndex: 10,
                position: 'relative'
            }}>
                {/* Drag Indicator */}
                <div style={{ width: '40px', height: '4px', background: '#E5E7EB', borderRadius: '2px', position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)' }} />

                <div style={{ fontSize: '13.5px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px', marginTop: '4px' }}>
                    Address Details
                </div>
                <div 
                    onClick={() => { 
                        if (addressError) {
                            haptics.light();
                            reverseGeocode(center.lat, center.lng);
                        }
                    }}
                    style={{ 
                        display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '28px',
                        cursor: addressError ? 'pointer' : 'default' 
                    }}
                >
                    {isResolving || isMoving ? (
                        <div style={{ width: '36px', height: '36px', borderRadius: '18px', background: 'rgba(21,105,253,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Loader2 size={20} color="#1569FD" className="animate-spin" />
                        </div>
                    ) : (
                        <div style={{ 
                            width: '36px', height: '36px', borderRadius: '18px', 
                            background: addressError ? 'rgba(239,68,68,0.1)' : 'rgba(21,105,253,0.1)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                            <MapPin size={20} color={addressError ? "#EF4444" : "#1569FD"} />
                        </div>
                    )}
                    <div style={{ 
                        flex: 1, fontSize: '16px', fontWeight: 600, lineHeight: 1.5, paddingTop: '6px',
                        color: addressError && !isMoving ? '#EF4444' : '#111827'
                    }}>
                        {isMoving ? 'Locating...' : address}
                    </div>
                </div>

                <button
                    className="confirm-btn"
                    onClick={() => {
                        haptics.success();
                        onSave({
                            lat: center.lat,
                            lng: center.lng,
                            address: address
                        });
                    }}
                    disabled={isResolving || isMoving || addressError || !address}
                    style={{
                        width: '100%', padding: '16px', background: '#1569FD', color: 'white',
                        border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 600,
                        opacity: (isResolving || isMoving || addressError) ? 0.6 : 1, transition: 'all 0.2s',
                        boxShadow: '0 8px 20px rgba(21,105,253,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        cursor: (isResolving || isMoving || addressError) ? 'not-allowed' : 'pointer'
                    }}
                >
                    <Check size={20} />
                    Confirm Location
                </button>
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                @keyframes slideUp { 
                    from { transform: translateY(100%); opacity: 0; } 
                    to { transform: translateY(0); opacity: 1; } 
                }

                .search-bar:focus-within {
                    border: 1.5px solid #1569FD !important;
                    box-shadow: 0 0 0 3px rgba(21,105,253,0.15) !important;
                    background: white !important;
                }
                
                .confirm-btn:active {
                    transform: scale(0.97) !important;
                }
            `}</style>
        </div>
    );
};

export default SetLocationScreen;
