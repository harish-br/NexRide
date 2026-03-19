import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Navigation, LocateFixed, MapPin, ArrowDown, Plus, Home, Briefcase, Loader2, Crosshair, ArrowLeft, TrainFront, Bus, Plane, Landmark, Bed } from 'lucide-react';
import emptyStateImg from '../assets/empty-state-search.png';
import haptics from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import SetLocationScreen from './SetLocationScreen';
import SavedPlacesListModal from './SavedPlacesListModal';

const API_KEY = "AIzaSyDlpxJyvl6FFHQGVO3_i-FsTO_-L9GlLO8";

import { generateMultiRoutes } from '../services/multiRouteService';
const SearchScreen = ({ onBack, onRouteFound, userPosition, initialData, userAddress }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    // Determine if we start in manual mode or live mode
    // If initialData exists and has isLive=true, we are in live mode.
    // IF initialData exists and has NO isLive, it's manual (from previous search history or what not).
    // If NO initialData, and we have userPosition, default to live.
    const isInitialLive = initialData?.origin?.isLive || (!initialData && !!userPosition);

    // State
    const [sourceQuery, setSourceQuery] = useState(() => {
        const name = initialData?.origin?.name;
        if (typeof name === 'string') return name;
        if (typeof initialData?.origin === 'string') return initialData.origin;
        if (isInitialLive && userAddress) return userAddress;
        return ""; // Start empty rather than generic placeholder
    });
    // If we have initial data providing a specific name that isn't live, use it. 

    const [destQuery, setDestQuery] = useState(() => {
        if (typeof initialData?.destination === 'string') return initialData.destination;
        if (initialData?.destination?.name) return initialData.destination.name;
        return "";
    });
    const [activeInput, setActiveInput] = useState('source'); // Start focused on source if needed
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [offlineWarning, setOfflineWarning] = useState(false);

    // Saved Places
    const { savedPlaces, savePlace, removePlace, getPlace } = useSavedPlaces();
    const [locationModalType, setLocationModalType] = useState(null); // 'home' | 'work' | 'custom'
    const [showSavedPlacesModal, setShowSavedPlacesModal] = useState(false);

    // Live Location logic
    // isManualInput=true means user typed something or selected a result.
    // isManualInput=false means we are tracking live location.
    const [isManualInput, setIsManualInput] = useState(!isInitialLive);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);

    // Refs
    const debounceTimeout = useRef(null);
    const sourceInputRef = useRef(null);

    // 1. Resolve Live Location Address
    useEffect(() => {
        // We only resolve if we are NOT in manual mode
        if (!isManualInput) {
            if (userAddress) {
                setSourceQuery(userAddress);
                setIsResolvingLocation(false);
            } else if (userPosition) {
                setIsResolvingLocation(true);
                const { lat, lng } = userPosition;

                // Fallback direct geocode if App.jsx hasn't resolved it yet
                fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.results && data.results[0]) {
                            // Extract more descriptive result like in App.jsx
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
                            setSourceQuery(""); // Keep empty if failed
                        }
                    })
                    .catch(err => {
                        console.error("Geocoding error:", err);
                        setSourceQuery("");
                    })
                    .finally(() => setIsResolvingLocation(false));
            } else {
                setSourceQuery("");
                setIsResolvingLocation(true);
            }
        }
    }, [userPosition, userAddress, isManualInput]);

    // Focus destination if we have a source already (and came back or initial load)
    useEffect(() => {
        if (initialData?.destination) {
            setActiveInput('dest');
        } else {
            // On first load, if source is live, focus destination
            if (!isManualInput && !initialData) {
                setActiveInput('dest');
            } else {
                sourceInputRef.current?.focus();
            }
        }
    }, []);

    // Smart UI reset for Offline badge
    useEffect(() => {
        const handleOnline = () => setOfflineWarning(false);
        const handleOffline = () => setOfflineWarning(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('app:manualRefresh', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('app:manualRefresh', handleOnline);
        };
    }, []);

    // 2. Fetch Suggestions
    const fetchSuggestions = async (input) => {
        if (!navigator.onLine) {
            setOfflineWarning(true);
            setSuggestions([]);
            return;
        }
        setOfflineWarning(false);

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

            if (!response.ok) throw new Error('Autocomplete API failed');
            const data = await response.json();

            if (data.suggestions) {
                const formatted = data.suggestions.map(s => {
                    const placePrediction = s.placePrediction;
                    return {
                        id: placePrediction.placeId || placePrediction.place,
                        name: placePrediction.structuredFormat?.mainText?.text || placePrediction.text?.text,
                        subtitle: placePrediction.structuredFormat?.secondaryText?.text || '',
                        distance: (Math.random() * 10 + 1).toFixed(1) + " " + t('common.km'),
                        types: placePrediction.types || [],
                        original: placePrediction
                    };
                });
                setSuggestions(formatted);
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = (val, type) => {
        if (type === 'source') {
            setSourceQuery(val);
            if (!isManualInput) setIsManualInput(true); // Switch to manual mode immediately
        } else {
            setDestQuery(val);
        }

        setActiveInput(type);

        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            fetchSuggestions(val);
        }, 300);
    };

    // 3. Handle Input Interaction
    const handleSourceFocus = () => {
        haptics.light();
        setActiveInput('source');
        // If it was live location, clear it on tap to allow typing
        if (!isManualInput) {
            setSourceQuery("");
            setIsManualInput(true);
            setSuggestions([]);
        }
    };

    const handleUseLiveLocation = () => {
        haptics.light();
        // Reset to live location mode
        setIsManualInput(false);
        setSourceQuery(t('common.fetching_location'));
        setActiveInput('dest');
        // Force re-evaluation of useEffect by ensuring state change (already tackled by setIsManualInput(false))
    };

    const getCategoryIcon = (types) => {
        const typeSet = new Set(types || []);
        if (typeSet.has('train_station') || typeSet.has('subway_station') || typeSet.has('transit_station')) {
            return { icon: <TrainFront size={22} color="#1A73E8" />, bg: 'rgba(26, 115, 232, 0.1)' };
        }
        if (typeSet.has('bus_station')) {
            return { icon: <Bus size={22} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)' };
        }
        if (typeSet.has('airport')) {
            return { icon: <Plane size={22} color="#1A73E8" />, bg: 'rgba(26, 115, 232, 0.1)' };
        }
        if (typeSet.has('lodging') || typeSet.has('hotel')) {
            return { icon: <Bed size={22} color="#9333EA" />, bg: 'rgba(147, 51, 234, 0.1)' };
        }
        if (typeSet.has('tourist_attraction') || typeSet.has('museum') || typeSet.has('landmark')) {
            return { icon: <Landmark size={22} color="#9333EA" />, bg: 'rgba(147, 51, 234, 0.1)' };
        }
        return { icon: <MapPin size={22} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)' };
    };

    const handleSelect = async (item) => {
        haptics.light();

        let lat = item.lat;
        let lng = item.lng;

        // If coordinates missing, fetch them
        if (!lat || !lng) {
            try {
                const response = await fetch(`https://places.googleapis.com/v1/places/${item.id}?fields=location&key=${API_KEY}`);
                const data = await response.json();
                if (data.location) {
                    lat = data.location.latitude;
                    lng = data.location.longitude;
                }
            } catch (err) {
                console.error("Error fetching place details:", err);
            }
        }

        const enrichedItem = { ...item, lat, lng };

        if (activeInput === 'source') {
            setSourceQuery(item.name);
            setIsManualInput(true);
            setActiveInput('dest');
            setSuggestions([]);
            setShowSuggestions(false);
            // We don't finish yet, wait for destination
        } else {
            setDestQuery(item.name);
            setSuggestions([]);
            setShowSuggestions(false);

            // Prepare Origin Data
            let originData = { name: sourceQuery, isLive: false };

            if (!isManualInput && userPosition) {
                originData = {
                    ...userPosition,
                    name: sourceQuery,
                    isLive: true
                };
            }

            /* 
            const multiRoutes = generateMultiRoutes(
                originData.isLive ? userPosition : { lat: originData.lat, lng: originData.lng },
                { lat: lat, lng: lng }
            );
            */

            onRouteFound({
                origin: originData,
                destination: enrichedItem,
                multiRoutes: [] // Ensure no routes are passed
            });
        }
    };

    const handleSavedPlaceClick = (place) => {
        haptics.light();
        if (activeInput === 'source') {
            setSourceQuery(place.name || place.type);
            setIsManualInput(true);
            setActiveInput('dest');
            setShowSavedPlacesModal(false);
        } else {
            setDestQuery(place.name || place.type);
            setShowSavedPlacesModal(false);

            let originData = { name: sourceQuery, isLive: false };
            if (!isManualInput && userPosition) originData = { ...userPosition, name: sourceQuery, isLive: true };
            
            onRouteFound({
                origin: originData,
                destination: { name: place.name || place.type, lat: place.lat, lng: place.lng },
                multiRoutes: []
            });
        }
    };

    const homePlace = getPlace('home');
    const workPlace = getPlace('work');
    const customPlaces = savedPlaces.filter(p => p.type === 'custom');

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: '#F5F6FA',
            zIndex: 100, display: 'flex', flexDirection: 'column',
        }}>
            {/* Header / Back action (Unified Style) */}
            <div style={{ padding: '24px 20px 0', zIndex: 10 }}>
                <button
                    onClick={() => {
                        haptics.light();
                        onBack();
                    }}
                    style={{
                        background: '#F3F4F6',
                        border: 'none',
                        borderRadius: '50%',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                >
                    <ArrowLeft size={22} color="#374151" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </button>
            </div>

            {/* Inputs Card Container */}
            <div style={{ padding: '12px 16px' }}>
                <div style={{
                    background: 'white', borderRadius: '24px', padding: '20px 16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    display: 'flex', flexDirection: 'row', alignItems: 'stretch'
                }}>

                    {/* LEFT COLUMN: VISUAL TIMELINE */}
                    <div style={{
                        width: '24px', marginRight: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        paddingTop: '6px', paddingBottom: '6px'
                    }}>
                        <div style={{ width: '8px', height: '8px', background: 'black', borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1, width: '0px', borderLeft: '2px dotted #D1D5DB', margin: '4px 0' }} />
                        <ArrowDown size={14} color="#FACC15" strokeWidth={4} flexShrink={0} />
                    </div>

                    {/* RIGHT COLUMN: INPUTS */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {/* Source Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px', position: 'relative' }}>
                            <Navigation size={18} color="#2563EB" fill="#2563EB" style={{ transform: isRTL ? 'rotate(-45deg)' : 'rotate(45deg)', flexShrink: 0 }} />

                            <input
                                ref={sourceInputRef}
                                value={sourceQuery}
                                onFocus={handleSourceFocus}
                                onChange={(e) => handleSearch(e.target.value, 'source')}
                                placeholder={t('search.start_location')}
                                style={{
                                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                    fontSize: '16px',
                                    fontWeight: !isManualInput ? '400' : '600', // Lighter for live, bold for typed
                                    color: !isManualInput ? '#2563EB' : '#111827', // Blue for live, Black for manual
                                    padding: 0, margin: 0,
                                    paddingInlineEnd: '40px', // RTL Friendly
                                    textAlign: isRTL ? 'right' : 'left',
                                    textOverflow: 'ellipsis'
                                }}
                            />
                            {offlineWarning && activeInput === 'source' && (
                                <div style={{ position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', color: '#EF4444', fontSize: '12px', fontWeight: '600' }}>
                                    Offline
                                </div>
                            )}

                            {/* Live Location Button (Inside Input) */}
                            <button
                                onClick={handleUseLiveLocation}
                                style={{
                                    position: 'absolute',
                                    right: isRTL ? 'auto' : 0,
                                    left: isRTL ? 0 : 'auto',
                                    width: '32px', height: '32px',
                                    borderRadius: '50%',
                                    border: 'none', // Remove border
                                    background: 'white', // Always white like FAB
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', // FAB Shadow
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isResolvingLocation ? (
                                    <Loader2 size={16} className="animate-spin" color="#3B82F6" />
                                ) : (
                                    <LocateFixed size={18} color="#3B82F6" />
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div style={{ height: '1px', background: '#F3F4F6', width: '100%' }} />

                        {/* Destination Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                            <input
                                value={destQuery}
                                onFocus={() => {
                                    haptics.light();
                                    setActiveInput('dest');
                                }}
                                onChange={(e) => handleSearch(e.target.value, 'dest')}
                                placeholder={t('search.where_to')}
                                style={{
                                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                    fontSize: '16px', fontWeight: '500', color: '#111827', padding: 0, margin: 0,
                                    textAlign: isRTL ? 'right' : 'left'
                                }}
                            />
                            {offlineWarning && activeInput === 'dest' && (
                                <div style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', color: '#EF4444', fontSize: '12px', fontWeight: '600' }}>
                                    Offline
                                </div>
                            )}

                            {destQuery && (
                                <button onClick={() => { setDestQuery(""); setSuggestions([]); setShowSuggestions(false); setOfflineWarning(false); }} style={{ background: 'none', border: 'none', padding: 0 }}>
                                    <X size={18} color="#9CA3AF" />
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Pill Buttons - Blue Icons */}
            <div
                className="no-scrollbar"
                style={{ display: 'flex', gap: '12px', padding: '0 20px', marginBottom: '10px', overflowX: 'auto' }}
            >
                {/* HOME */}
                {homePlace ? (
                    <button onClick={() => handleSavedPlaceClick(homePlace)} style={{
                        flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                    }}>
                        <Home size={18} color="#1A73E8" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                        {homePlace.name || 'Home'}
                    </button>
                ) : (
                    <button onClick={() => { haptics.light(); setLocationModalType('home'); }} style={{
                        flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                    }}>
                        <Home size={18} color="#1A73E8" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                        {t('search.add_home')}
                    </button>
                )}

                {/* WORK */}
                {workPlace ? (
                    <button onClick={() => handleSavedPlaceClick(workPlace)} style={{
                        flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                    }}>
                        <Briefcase size={18} color="#1A73E8" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                        {workPlace.name || 'Work'}
                    </button>
                ) : (
                    <button onClick={() => { haptics.light(); setLocationModalType('work'); }} style={{
                        flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                    }}>
                        <Briefcase size={18} color="#1A73E8" style={{ transform: isRTL ? 'scaleX(-1)' : 'none' }} />
                        {t('search.add_work')}
                    </button>
                )}

                {/* MORE & CUSTOM PLACES */}
                {customPlaces.map(place => (
                    <button key={place.id} onClick={() => handleSavedPlaceClick(place)} style={{
                        flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                        display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                    }}>
                        <MapPin size={18} color="#1A73E8" />
                        {place.name}
                    </button>
                ))}

                <button onClick={() => { haptics.light(); setShowSavedPlacesModal(true); }} style={{
                    flex: 'none', background: 'white', border: '1px solid #E5E7EB', borderRadius: '50px', padding: '8px 16px',
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#111827', fontWeight: '600'
                }}>
                    <Plus size={18} color="#1A73E8" />
                    {t('search.more')}
                </button>
            </div>

            {/* Suggestions List */}
            <div style={{ flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
                {!showSuggestions && (
                    <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 40px', opacity: destQuery.length > 1 ? 0 : 1, transition: 'opacity 0.2s', pointerEvents: destQuery.length > 1 ? 'none' : 'auto' }}>
                        <img src={emptyStateImg} alt="Search" style={{ width: '200px', marginBottom: '24px' }} />
                        <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>{t('search.empty_title')}</h2>
                        <p style={{ fontSize: '15px', color: '#6B7280', fontWeight: '500' }}>{t('search.empty_subtitle')}</p>
                    </div>
                )}
                {showSuggestions && (
                    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeInUp 0.3s ease-out' }}>
                        {suggestions.map((item) => {
                            const { icon, bg } = getCategoryIcon(item.types);
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => handleSelect(item)} 
                                    style={{ 
                                        background: 'white', 
                                        borderRadius: '16px', 
                                        padding: '12px 16px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '16px', 
                                        cursor: 'pointer', 
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                        border: '1px solid #F3F4F6',
                                        transition: 'transform 0.1s active'
                                    }}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ 
                                        width: '44px', 
                                        height: '44px', 
                                        borderRadius: '50%', 
                                        background: bg, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        flexShrink: 0 
                                    }}>
                                        {icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.subtitle}
                                        </div>
                                    </div>
                                    {item.distance && (
                                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', flexShrink: 0 }}>
                                            {item.distance}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Map Button - v2 */}
            <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                <button onClick={() => {
                    haptics.light();
                    onBack();
                }} style={{ background: '#111827', color: 'white', border: 'none', borderRadius: '100px', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: '600', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', pointerEvents: 'auto' }}>
                    <div style={{ width: '10px', height: '10px', background: '#FACC15', borderRadius: '50%' }} />
                    {t('search.map_view')}
                </button>
            </div>

            {/* MODALS */}
            {locationModalType && (
                <SetLocationScreen
                    type={locationModalType}
                    initialLocation={userPosition}
                    onClose={() => setLocationModalType(null)}
                    onSave={(location) => {
                        let name = 'Custom ' + Math.floor(Math.random() * 100);
                        let id = Date.now().toString();
                        if (locationModalType === 'home') {
                            name = 'Home';
                            id = 'home';
                        } else if (locationModalType === 'work') {
                            name = 'Work';
                            id = 'work';
                        } else {
                            name = location.address.split(',')[0]; // Use first part of address as short name
                        }

                        savePlace({
                            id,
                            type: locationModalType,
                            name,
                            lat: location.lat,
                            lng: location.lng,
                            address: location.address
                        });
                        setLocationModalType(null);
                    }}
                />
            )}

            <SavedPlacesListModal
                isOpen={showSavedPlacesModal}
                onClose={() => setShowSavedPlacesModal(false)}
                savedPlaces={savedPlaces}
                onSelectPlace={handleSavedPlaceClick}
                onDeletePlace={removePlace}
                onAddNewPlace={() => {
                    setShowSavedPlacesModal(false);
                    // Add delay to prevent unmount glitch
                    setTimeout(() => setLocationModalType('custom'), 50); 
                }}
            />

            <style>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SearchScreen;
