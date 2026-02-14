import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowUpDown, MapPin, Search, QrCode, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { normalizePlace } from '../utils/busSearchUtils';
import haptics from '../utils/haptics';
import { busSchedules } from '../data/busSchedules';
import busIconImg from '../assets/bus_hero_final.png';
import trainIconImg from '../assets/train_hero_final.png';

const BusBookingSheet = ({ isOpen, onClose, onActiveRideClick, userAddress, userPosition }) => {
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
                    subtitle: s.placePrediction.structuredFormat?.secondaryText?.text || ''
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
    }, [isOpen]);

    // ------------------------------------------------------------
    // BUS SEARCH LOGIC (Auto-Trigger)
    // ------------------------------------------------------------
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    const { upcomingBuses, routeStatus } = useMemo(() => {
        let normSource = normalizePlace(source);
        let normDest = normalizePlace(destination);
        const isValidInput = normSource && normDest && normSource !== normDest;

        if (!isValidInput) {
            return { upcomingBuses: [], routeStatus: 'INVALID_INPUT' };
        }

        // --- SEARCH LOGIC UPDATED FOR BHAVANI SUPPORT ---
        // If user searches "Bhavani" <-> "Erode" OR "Bhavani" <-> "Anthiyur", 
        // we should show "Anthiyur-Erode" buses because they pass through Bhavani.

        let targetRouteCode = null;

        // Check for Bhavani edge case
        const isBhavaniInvolved = normSource.includes('bhavani') || normDest.includes('bhavani');

        if (isBhavaniInvolved) {
            // Case 1: Bhavani <-> Erode (Show ANT-ERD buses)
            if ((normSource.includes('bhavani') && normDest.includes('erode')) ||
                (normSource.includes('erode') && normDest.includes('bhavani'))) {
                targetRouteCode = 'ANT-ERD';
            }
            // Case 2: Bhavani <-> Anthiyur (Show ANT-ERD buses)
            else if ((normSource.includes('bhavani') && normDest.includes('anthiyur')) ||
                (normSource.includes('anthiyur') && normDest.includes('bhavani'))) {
                targetRouteCode = 'ANT-ERD';
            }
        }

        // 1. Find ALL buses for this route (ignoring time)
        const routeBuses = busSchedules.filter(bus => {
            // Priority: Explicit Route Code Match (for Bhavani logic)
            if (targetRouteCode) {
                return bus.routeCode === targetRouteCode;
            }
            const busFrom = normalizePlace(bus.from);
            const busTo = normalizePlace(bus.to);

            // Strict Direction Match
            const fromMatch = busFrom === normSource || busFrom.includes(normSource) || normSource.includes(busFrom);
            const toMatch = busTo === normDest || busTo.includes(normDest) || normDest.includes(busTo);

            return fromMatch && toMatch;
        });

        if (routeBuses.length === 0) {
            return { upcomingBuses: [], routeStatus: 'NO_ROUTE' };
        }

        // 2. Filter by Time (Future Only)
        const now = currentTime; // Use stable currentTime state
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const toMinutes = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        const futureBuses = routeBuses.filter(bus => {
            const busMinutes = toMinutes(bus.departureTime);
            return busMinutes >= currentTotalMinutes;
        });

        // 3. Sort
        futureBuses.sort((a, b) => {
            return toMinutes(a.departureTime) - toMinutes(b.departureTime);
        });

        if (futureBuses.length === 0) {
            return { upcomingBuses: [], routeStatus: 'NO_FUTURE_BUSES' };
        }

        return { upcomingBuses: futureBuses, routeStatus: 'FOUND' };

    }, [source, destination, currentTime]);


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

    const handleKeypadPress = (num) => {
        haptics.light();
        const nextOtp = [...otp];
        const firstEmptyIndex = nextOtp.findIndex(d => d === '');
        if (firstEmptyIndex !== -1) {
            nextOtp[firstEmptyIndex] = num;
            setOtp(nextOtp);
        }
    };

    const handleBackspace = () => {
        haptics.light();
        const nextOtp = [...otp];
        let lastFilledIndex = -1;
        for (let i = 3; i >= 0; i--) {
            if (nextOtp[i] !== '') {
                lastFilledIndex = i;
                break;
            }
        }
        if (lastFilledIndex !== -1) {
            nextOtp[lastFilledIndex] = '';
            setOtp(nextOtp);
        }
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
                                    Find Buses
                                </h1>
                            </div>

                            {/* --- SCROLLABLE CONTENT --- */}
                            <div style={{ flex: 1, overflowY: 'auto', position: 'relative', paddingBottom: '140px' }}>
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
                                                    placeholder="Start location"
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
                                                    placeholder="Where are you going?"
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
                                                {bgSuggestions.map(s => (
                                                    <div key={s.id} onClick={() => {
                                                        if (activeInput === 'source') {
                                                            setSource(s.name);
                                                            setIsManualInput(true);
                                                        } else {
                                                            setDestination(s.name);
                                                        }
                                                        setBgSuggestions([]);
                                                    }}
                                                        style={{ padding: '16px', borderBottom: '1px solid #F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <MapPin size={16} color="#9CA3AF" />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1F2937' }}>{s.name}</div>
                                                            {s.subtitle && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{s.subtitle}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* --- RESULTS SECTION --- */}

                                    {/* CASE: FOUND BUSES */}
                                    {routeStatus === 'FOUND' && (
                                        <div style={{ marginTop: '24px' }}>
                                            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '16px', fontWeight: '600' }}>
                                                Results from {source} to {destination}
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
                                                let statusLabel = 'ON TIME';
                                                let statusColor = '#E0F2FE';
                                                let statusText = '#0369A1';

                                                if (diff <= 15) {
                                                    statusLabel = 'ARRIVING';
                                                    statusColor = '#DCFCE7';
                                                    statusText = '#166534';
                                                }

                                                return (
                                                    <div key={i} style={{
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        padding: '16px',
                                                        marginBottom: '12px',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                        border: '1px solid #F3F4F6',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        minHeight: '80px'
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
                                                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Content Container (Z-Index 1) */}
                                                        <div style={{
                                                            position: 'relative',
                                                            zIndex: 1,
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '12px', // Increased gap between top and bottom sections
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
                                                                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>{bus.serviceType}</div>
                                                                </div>
                                                            </div>

                                                            {/* Bottom Row: Path Visual */}
                                                            <div style={{
                                                                paddingTop: '12px',
                                                                borderTop: '1px solid #F3F4F6',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between', // Ensure edge-to-edge alignment
                                                                gap: '12px',
                                                                width: '100%' // Full width of the container
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
                                                {routeStatus === 'NO_ROUTE' ? 'Buses not available for this route' : 'No more buses available today'}
                                            </h2>
                                            <p style={{ fontSize: '14px', color: '#6B7280' }}>
                                                {routeStatus === 'NO_ROUTE' ?
                                                    'Check your spelling or try a nearby city.' :
                                                    'Services have ended for the day. Please check back tomorrow.'}
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
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Active Ride</span>
                                    <span style={{ opacity: 0.5, fontSize: '12px' }}>|</span>
                                    <QrCode size={14} color="white" />
                                    <span style={{ fontSize: '12px', fontWeight: '600' }}>QR Code</span>
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
