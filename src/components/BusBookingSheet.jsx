import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpDown, MapPin, Search, QrCode, TrainFront, Bus, Plane, Landmark, Bed } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import haptics from '../utils/haptics';
import { busService } from '../services/busService';
import busIconImg from '../assets/bus_hero_final.png';
import trainIconImg from '../assets/train_hero_final.png';

// --- OPTIMIZED BUS CARD COMPONENT ---
const BusCard = React.memo(({ bus, source, destination, isTrain, statusLabel, statusColor, statusText }) => {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            border: '1px solid #F3F4F6',
            position: 'relative',
            overflow: 'hidden',
            minHeight: '80px',
            willChange: 'transform' // Hint for GPU acceleration
        }}>
            {/* 3D Icon - Absolute Right */}
            <div style={{
                position: 'absolute',
                right: '-20px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '100px',
                height: '75px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 1,
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                <img
                    src={isTrain ? trainIconImg : busIconImg}
                    alt="Transport Mode"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        // Removed heavy filter: drop-shadow for scroll performance
                    }}
                />
            </div>

            {/* Content Container (Z-Index 1) */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                paddingRight: '50px'
            }}>
                {/* Top Row: Time + Status & Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Time & Status Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111', lineHeight: '1.2' }}>{bus.departureTime}</div>

                        <div style={{ width: '1px', height: '16px', background: '#D1D5DB' }}></div>

                        <div style={{
                            background: statusColor, color: statusText,
                            fontSize: '11px', fontWeight: 600,
                            padding: '4px 10px', borderRadius: '100px',
                            letterSpacing: '0.5px', whiteSpace: 'nowrap'
                        }}>
                            {statusLabel}
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>{bus.operatorName}</div>
                        <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
                            {(() => {
                                let displayName = bus.busName || bus.serviceType || '';
                                if (displayName.toLowerCase() === 'standard') {
                                    displayName = '';
                                }
                                return (
                                    <>
                                        {displayName}
                                        {bus.via && (
                                            <span style={{ marginLeft: displayName ? '8px' : '0', color: '#6B7280', fontSize: '12px', fontWeight: '400' }}>
                                                {displayName ? '• ' : ''}via {bus.via}
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Path Visual */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid #F3F4F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%'
                }}>
                    {/* Source */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF' }} />
                        <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {source.split(',')[0].trim().replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                    </div>

                    {/* Connector */}
                    <div style={{ flex: 1, height: '1px', borderTop: '2px dotted #E5E7EB', margin: '0 4px' }} />

                    {/* Destination */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#111827' }} />
                        <div style={{ fontSize: '13px', color: '#1F2937', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {destination.split(',')[0].trim().replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const BusBookingSheet = ({ isOpen, onClose, onActiveRideClick, userAddress }) => {
    const { t } = useTranslation();
    // State
    const [source, setSource] = useState(userAddress || "");
    const [destination, setDestination] = useState("");
    const [bgSuggestions, setBgSuggestions] = useState([]);
    const [isManualInput, setIsManualInput] = useState(false);
    const [activeInput, setActiveInput] = useState(null); // 'source' or 'destination'

    // Google Places API (REST)
    const API_KEY = "AIzaSyDlpxJyvl6FFHQGVO3_i-FsTO_-L9GlLO8";
    const debounceTimeout = React.useRef(null);

    const fetchSuggestions = async (input, setSuggestions) => {
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

            const data = await response.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions.map(s => ({
                    id: s.placePrediction.placeId || s.placePrediction.place,
                    name: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text,
                    subtitle: s.placePrediction.structuredFormat?.secondaryText?.text || '',
                    types: s.placePrediction.types || []
                })));
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Autocomplete Error:", error);
            setSuggestions([]);
        }
    };

    const handleInputChange = (val, type) => {
        if (type === 'source') {
            setSource(val);
            if (!isManualInput) setIsManualInput(true);
        } else {
            setDestination(val);
        }

        setActiveInput(type);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        if (val.length >= 2) {
            debounceTimeout.current = setTimeout(() => {
                fetchSuggestions(val, setBgSuggestions);
            }, 300);
        } else {
            setBgSuggestions([]);
        }
    };

    // Sync source with userAddress when it changes and NOT in manual mode
    useEffect(() => {
        if (!isManualInput && userAddress) {
            setSource(userAddress);
        }
    }, [userAddress, isManualInput]);

    useEffect(() => {
        if (isOpen) {
            // Reset if needed or sync initial
            if (!isManualInput && userAddress) {
                setSource(userAddress);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // ------------------------------------------------------------
    // BUS SEARCH LOGIC (Firestore-Triggered)
    // ------------------------------------------------------------
    const [currentTime, setCurrentTime] = useState(new Date());
    const [upcomingBuses, setUpcomingBuses] = useState([]);
    const [routeStatus, setRouteStatus] = useState('INVALID_INPUT');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const performSearch = async () => {
            if (!source || !destination || source === destination) {
                setRouteStatus('INVALID_INPUT');
                setUpcomingBuses([]);
                setIsSearching(false);
                return;
            }

            try {
                const results = await busService.getSchedules(source, destination);
                
                if (results.length === 0) {
                    setRouteStatus('NO_ROUTE');
                    setUpcomingBuses([]);
                } else {
                    const now = new Date();
                    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

                    const toMinutes = (timeStr) => {
                        const [time, period] = timeStr.split(' ');
                        let [hours, minutes] = time.split(':').map(Number);
                        if (period === 'PM' && hours !== 12) hours += 12;
                        if (period === 'AM' && hours === 12) hours = 0;
                        return hours * 60 + minutes;
                    };

                    const futureBuses = results.filter(bus => {
                        const busMinutes = toMinutes(bus.departureTime);
                        return busMinutes >= currentTotalMinutes - 10;
                    });

                    futureBuses.sort((a, b) => toMinutes(a.departureTime) - toMinutes(b.departureTime));

                    if (futureBuses.length === 0) {
                        setRouteStatus('NO_FUTURE_BUSES');
                    } else {
                        setRouteStatus('FOUND');
                    }
                    setUpcomingBuses(futureBuses);
                }
            } catch (error) {
                console.error("Search failed:", error);
                setRouteStatus('NO_ROUTE');
            } finally {
                setIsSearching(false);
            }
        };

        if (source && destination && source !== destination) {
            setIsSearching(true);
        }
        const timer = setTimeout(performSearch, 500); 
        return () => clearTimeout(timer);
    }, [source, destination, currentTime]);


    const getCategoryIcon = (types) => {
        const typeSet = new Set(types || []);
        if (typeSet.has('train_station') || typeSet.has('subway_station') || typeSet.has('transit_station')) {
            return { icon: <TrainFront size={18} color="#1A73E8" />, bg: 'rgba(26, 115, 232, 0.1)' };
        }
        if (typeSet.has('bus_station')) {
            return { icon: <Bus size={18} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)' };
        }
        if (typeSet.has('airport')) {
            return { icon: <Plane size={18} color="#1A73E8" />, bg: 'rgba(26, 115, 232, 0.1)' };
        }
        if (typeSet.has('lodging') || typeSet.has('hotel')) {
            return { icon: <Bed size={18} color="#9333EA" />, bg: 'rgba(147, 51, 234, 0.1)' };
        }
        if (typeSet.has('tourist_attraction') || typeSet.has('museum') || typeSet.has('landmark')) {
            return { icon: <Landmark size={18} color="#9333EA" />, bg: 'rgba(147, 51, 234, 0.1)' };
        }
        return { icon: <MapPin size={18} color="#EAB308" />, bg: 'rgba(234, 179, 8, 0.1)' };
    };

    // ------------------------------------------------------------
    // HANDLERS
    // ------------------------------------------------------------
    const handleSwap = () => {
        haptics.light();
        setSource(destination);
        setDestination(source);
    };

    const handleBack = () => {
        haptics.light();
        onClose();
    };



    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* --- BACKDROP --- */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 2999,
                            background: 'rgba(0,0,0,0.1)', // Subtle dim
                            backdropFilter: 'blur(2px)', // Soft blur
                            pointerEvents: 'none' // Click-through to background logic if needed, but usually blocks. 
                            // User said "Disable background interactions", so maybe pointerEvents: 'auto' to block clicks?
                            // But keeping it 'none' and using the main div for interaction is safer for now unless I want to close on bg click.
                        }}
                    />

                    {/* --- MAIN SHEET --- */}
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 3000, pointerEvents: 'none'
                    }}>
                        <motion.div
                            initial={{ y: '100%', scale: 0.97 }}
                            animate={{ y: '0%', scale: 1 }}
                            exit={{ y: '100%', scale: 0.97 }}
                            transition={{
                                type: 'tween',
                                ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier(0.25, 0.1, 0.25, 1) - 'ease' like
                                duration: 0.35
                            }}
                            style={{
                                position: 'absolute', inset: 0,
                                background: '#F9FAFB',
                                pointerEvents: 'auto',
                                display: 'flex', flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' // Lifted feel
                            }}
                        >
                            {/* --- TOP HEADER --- */}
                            <div style={{
                                height: '64px',
                                padding: '0 16px',
                                display: 'flex', alignItems: 'center',
                                background: 'white',
                                borderBottom: '1px solid #E5E7EB',
                                zIndex: 100,
                                paddingTop: 'env(safe-area-inset-top)'
                            }}>
                                <button onClick={handleBack} style={{
                                    width: 40, height: 40, borderRadius: '50%', background: '#F3F4F6', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    marginRight: '16px'
                                }}>
                                    <ArrowLeft size={22} color="#1F2937" />
                                </button>
                                <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 }}>
                                    {t('bus_booking.find_buses')}
                                </h1>
                            </div>

                            {/* --- SCROLLABLE CONTENT --- */}
                            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: '140px', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', touchAction: 'pan-y' }}>
                                <div style={{ padding: '24px' }}>

                                    {/* INPUT CARD - RELATIVE PARENT FOR SUGGESTIONS */}
                                    <div style={{
                                        background: 'white', borderRadius: '24px', padding: '20px 16px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                                        display: 'flex', flexDirection: 'row', alignItems: 'stretch',
                                        position: 'relative', zIndex: 50
                                    }}>
                                        {/* Timeline */}
                                        <div style={{
                                            width: '24px', marginRight: '12px',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            paddingTop: '6px', paddingBottom: '6px'
                                        }}>
                                            <div style={{ width: '8px', height: '8px', background: 'black', borderRadius: '50%', flexShrink: 0 }} />
                                            <div style={{ flex: 1, width: '0px', borderLeft: '2px dotted #D1D5DB', margin: '4px 0' }} />
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FACC15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 5v14M19 12l-7 7-7-7" />
                                            </svg>
                                        </div>

                                        {/* Inputs */}
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {/* Source */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px', position: 'relative' }}>
                                                <input
                                                    value={source}
                                                    onChange={(e) => handleInputChange(e.target.value, 'source')}
                                                    onFocus={() => setActiveInput('source')}
                                                    onClick={() => {
                                                        if (!isManualInput) {
                                                            setSource('');
                                                            setIsManualInput(true);
                                                        }
                                                    }}
                                                    placeholder={t('bus_booking.start_location')}
                                                    style={{
                                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                                        fontSize: '16px',
                                                        fontWeight: !isManualInput ? '400' : '600',
                                                        color: !isManualInput ? '#2563EB' : '#111827',
                                                        padding: 0, margin: 0, paddingRight: '40px'
                                                    }}
                                                />
                                                <button
                                                    onClick={handleSwap}
                                                    style={{
                                                        position: 'absolute', right: 0,
                                                        width: '32px', height: '32px',
                                                        borderRadius: '50%', border: '1px solid #E5E7EB',
                                                        background: 'white',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <ArrowUpDown size={14} color="#6B7280" />
                                                </button>
                                            </div>

                                            <div style={{ height: '1px', background: '#F3F4F6', width: '100%' }} />

                                            {/* Destination */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '24px' }}>
                                                <input
                                                    value={destination}
                                                    onChange={(e) => handleInputChange(e.target.value, 'destination')}
                                                    onFocus={() => setActiveInput('destination')}
                                                    placeholder={t('bus_booking.where_to')}
                                                    style={{
                                                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                                        fontSize: '16px', fontWeight: '500', color: '#111827', padding: 0, margin: 0
                                                    }}
                                                />
                                            </div>
                                        </div>


                                        {/* SUGGESTIONS - FLOATING / HOVER UP */}
                                        {bgSuggestions.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%', left: 0, right: 0,
                                                marginTop: '12px',
                                                background: 'white', border: '1px solid #F3F4F6',
                                                borderRadius: '16px', overflow: 'hidden',
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                                zIndex: 60
                                            }}>
                                                {bgSuggestions.map(s => {
                                                    const { icon, bg } = getCategoryIcon(s.types);
                                                    return (
                                                        <div key={s.id} onClick={() => {
                                                            if (activeInput === 'source') {
                                                                setSource(s.name);
                                                                setIsManualInput(true);
                                                            } else {
                                                                setDestination(s.name);
                                                            }
                                                            setBgSuggestions([]);
                                                        }}
                                                            style={{ 
                                                                padding: '12px 16px', 
                                                                borderBottom: '1px solid #F9FAFB', 
                                                                cursor: 'pointer', 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '16px',
                                                                transition: 'background 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <div style={{ 
                                                                width: '40px', 
                                                                height: '40px', 
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
                                                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                                {s.subtitle && <div style={{ fontSize: '12px', color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.subtitle}</div>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* CASE: SEARCHING */}
                                    {isSearching && (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                                            <div className="animate-spin" style={{ 
                                                width: '24px', height: '24px', border: '2px solid #F3F4F6', 
                                                borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto 12px' 
                                            }}></div>
                                            <span>{t('bus_booking.searching')}...</span>
                                        </div>
                                    )}

                                    {/* CASE: FOUND BUSES */}
                                    {!isSearching && routeStatus === 'FOUND' && (
                                        <div style={{ marginTop: '24px' }}>
                                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', fontWeight: '600' }}>
                                                {t('bus_booking.results_from_to', { source, destination })}
                                            </div>
                                            {upcomingBuses.map((bus, i) => {
                                                const isTrain = bus.operatorName.toLowerCase().includes('train');

                                                // Determine Status
                                                const now = new Date();
                                                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                                // Simple parse for status logic
                                                const timeParts = bus.departureTime.split(' ');
                                                let h = parseInt(timeParts[0].split(':')[0]);
                                                const m = parseInt(timeParts[0].split(':')[1]);
                                                if (timeParts[1] === 'PM' && h !== 12) h += 12;
                                                if (timeParts[1] === 'AM' && h === 12) h = 0;
                                                const busTotal = h * 60 + m;

                                                const diff = busTotal - currentMinutes;
                                                let statusLabel = t('bus_booking.on_time');
                                                let statusColor = '#E0F2FE';
                                                let statusText = '#0369A1';

                                                if (diff <= 15) {
                                                    statusLabel = t('bus_booking.arriving');
                                                    statusColor = '#DCFCE7';
                                                    statusText = '#166534';
                                                }

                                                return (
                                                    <BusCard
                                                        key={`${bus.routeCode}-${bus.departureTime}-${i}`}
                                                        bus={bus}
                                                        source={source}
                                                        destination={destination}
                                                        isTrain={isTrain}
                                                        statusLabel={statusLabel}
                                                        statusColor={statusColor}
                                                        statusText={statusText}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* CASE: NO ROUTE or NO FUTURE BUSES */}
                                    {(routeStatus === 'NO_ROUTE' || routeStatus === 'NO_FUTURE_BUSES') && (
                                        <div style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '40px', textAlign: 'center', marginTop: '20px'
                                        }}>
                                            <div style={{
                                                width: '80px', height: '80px', borderRadius: '50%',
                                                background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                marginBottom: '16px'
                                            }}>
                                                <Search size={32} color="#9CA3AF" />
                                            </div>
                                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                                {routeStatus === 'NO_ROUTE' ? t('bus_booking.no_route') : t('bus_booking.no_future_buses')}
                                            </h2>
                                            <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                                {routeStatus === 'NO_ROUTE' ? t('bus_booking.no_route_desc') : t('bus_booking.no_future_buses_desc')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- BOTTOM ACTION AREA --- */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                padding: '24px',
                                background: 'transparent',
                                zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                pointerEvents: 'none' // Allow click through to list
                            }}>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        haptics.impact();
                                        if (onActiveRideClick) onActiveRideClick();
                                    }}
                                    style={{
                                        background: '#1569fd', color: 'white', border: 'none', borderRadius: '100px',
                                        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 8px 20px rgba(0,0,0,0.15)', cursor: 'pointer',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('bus_booking.active_ride')}</span>
                                    <span style={{ opacity: 0.5, fontSize: '12px' }}>|</span>
                                    <QrCode size={14} color="white" />
                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{t('bus_booking.qr_code')}</span>
                                </motion.button>
                            </div>

                        </motion.div>

                    </div>
                </>
            )}
        </AnimatePresence >
    );
};
export default BusBookingSheet;
