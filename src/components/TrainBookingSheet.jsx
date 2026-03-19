import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Navigation2, ArrowLeft, ArrowRight, Clock, AlertTriangle, TrainFront } from 'lucide-react';
import { fetchTrainStatus, searchStations, fetchLiveStationData } from '../utils/trainApi';
import { useTranslation } from 'react-i18next';
import TrainStatusDashboard from './TrainStatusDashboard';
import GlobalLoader from './GlobalLoader';

// Haptics stub
const haptics = {
    light: () => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(5);
        }
    },
    success: () => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([10, 30, 10]);
        }
    },
    error: () => {
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate([50, 50, 50]);
        }
    }
};

const trainIconImg = "/icons/train_new_square.jpg"; // Consistent asset


// --- Helper Component: Train List Item (Premium Card Style) ---
const TrainListItem = ({ train }) => {
    // Status Logic for Color
    const isLate = train.isLate;
    const isArrived = train.hasArrived;

    // Status Badge Style
    const badgeStyle = {
        background: isArrived ? '#ECFDF5' : (isLate ? '#FEF2F2' : '#EFF6FF'),
        color: isArrived ? '#059669' : (isLate ? '#DC2626' : '#3B82F6'),
        fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px',
        display: 'inline-block', letterSpacing: '0.3px'
    };

    return (
        <div style={{
            background: 'white', borderRadius: '16px', padding: '16px',
            marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            border: '1px solid #F3F4F6', position: 'relative'
        }}>
            {/* Top Row: Train Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                            background: '#F3F4F6', color: '#4B5563',
                            fontSize: '11px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px'
                        }}>
                            {train.trainNumber}
                        </span>
                        {train.platform !== 'TBD' && (
                            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>
                                • PF {train.platform}
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111', lineHeight: '1.3' }}>
                        {train.trainName}
                    </div>
                </div>

                {/* Time Display */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                        {train.expectedDeparture || train.expectedArrival}
                    </div>
                    {/* Show Scheduled if different */}
                    {(train.expectedDeparture !== train.scheduledDeparture) && (
                        <div style={{ fontSize: '11px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                            {train.scheduledDeparture || train.scheduledArrival}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row: Status Badge & Divider */}
            <div style={{ borderTop: '1px dashed #E5E7EB', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={badgeStyle}>
                    {train.delayText || train.status}
                </div>

                {/* Visual Helper */}
                <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '500' }}>
                    {isArrived ? 'Arrived' : (train.hasDeparted ? 'Departed' : (isLate ? 'Running Late' : 'On Time'))}
                </div>
            </div>
        </div>
    );
};

const TrainBookingSheet = ({ isOpen, onClose, onTrainLocationFound }) => {
    const { t } = useTranslation();
    // 1. Unified Input State
    const [query, setQuery] = useState("");

    // 2. Results State
    const [suggestions, setSuggestions] = useState([]); // For Stations
    const [trainData, setTrainData] = useState(null);   // For Train Live Status
    const [stationBoard, setStationBoard] = useState(null); // For Station Live Board

    // 3. UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeBoardTab, setActiveBoardTab] = useState('arriving'); // 'atStation', 'arriving', 'departing'

    const inputRef = useRef(null);

    // --- Reset on Open/Close ---
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSuggestions([]);
            setTrainData(null);
            setStationBoard(null);
            setError(null);
            setLoading(false);
            // Auto-focus after animation
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleClose = () => {
        haptics.light();
        onClose();
    };

    // --- SMART SEARCH ENGINE ---
    const handleSearch = async (val) => {
        setQuery(val);
        setError(null);
        setTrainData(null); // Clear previous train results immediately on change
        setStationBoard(null);

        const cleanVal = val.trim();

        if (!cleanVal) {
            setSuggestions([]);
            return;
        }

        // --- CLASSIFICATION LOGIC ---
        const isNumeric = /^\d+$/.test(cleanVal);

        if (isNumeric) {
            // MODE: TRAIN NUMBER (Wait for 5 digits)
            setSuggestions([]); // Clear station suggestions
            if (cleanVal.length === 5) {
                // AUTO-FETCH TRIGGER
                setLoading(true);
                haptics.light();
                try {
                    const res = await fetchTrainStatus(cleanVal);
                    // Standardize API response
                    const data = res.data || res;

                    if (data && (data.trainNumber || data.trainName)) {
                        setTrainData(data);
                        haptics.success();

                        // MAP UPDATE: If current location has coords, move map
                        if (data.currentLocation && data.currentLocation.lat && data.currentLocation.lng) {
                            onTrainLocationFound && onTrainLocationFound({
                                lat: parseFloat(data.currentLocation.lat),
                                lng: parseFloat(data.currentLocation.lng),
                                title: `${data.trainName} (Live)`
                            });
                        }
                    } else {
                        setError("Train not found or inactive.");
                        haptics.error();
                    }
                } catch (err) {
                    console.error(err);
                    setError("Could not fetch train status.");
                    haptics.error();
                } finally {
                    setLoading(false);
                }
            }
        } else {
            // MODE: STATION SEARCH (Wait for 2+ chars)
            if (cleanVal.length >= 2) {
                try {
                    // Start suggestion search
                    // Note: We don't set 'loading' here to avoid flickering, just update list
                    const results = await searchStations(cleanVal);
                    setSuggestions(results || []);
                } catch (err) {
                    console.error(err);
                    // Silent fail for suggestions is better than error UI
                }
            } else {
                setSuggestions([]);
            }
        }
    };

    // --- HANDLE STATION SELECTION ---
    const handleStationSelect = async (station) => {
        haptics.success();
        setQuery(`${station.name} (${station.code})`);
        setSuggestions([]); // Hide list

        setLoading(true);
        setError(null);

        try {
            const data = await fetchLiveStationData(station.code);
            console.log("Station Data:", data); // Debug log
            if (data && (data.arriving || data.departing || data.atStation)) {
                setStationBoard(data);

                // Smart tab selection: If 'At Station' has data, show it. Else 'Arriving'.
                if (data.atStation && data.atStation.length > 0) setActiveBoardTab('atStation');
                else if (data.arriving && data.arriving.length > 0) setActiveBoardTab('arriving');
                else setActiveBoardTab('departing');

            } else {
                setError("No live data found for this station.");
            }
        } catch (err) {
            console.error(err);
            setError("Unable to fetch live station board.");
            haptics.error();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 1. BACKDROP */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                            zIndex: 60
                        }}
                    />

                    {/* 2. SHEET CONTAINER */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed', left: 0, right: 0, bottom: 0,
                            height: '92vh', // Almost full screen like Bus Sheet
                            background: '#F9FAFB',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            zIndex: 70,
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.2)'
                        }}
                    >
                        {/* --- HEADER --- */}
                        <div style={{
                            padding: '20px 24px',
                            background: 'white',
                            borderBottom: '1px solid #E5E7EB',
                            borderTopLeftRadius: '24px', borderTopRightRadius: '24px',
                            display: 'flex', alignItems: 'center', gap: '16px',
                            flexShrink: 0
                        }}>
                            <button
                                onClick={handleClose}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: '#F3F4F6', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <ArrowLeft size={20} color="#374151" />
                            </button>
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: 0, letterSpacing: '-0.5px' }}>
                                    Find Trains
                                </h2>
                                <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0 0' }}>
                                    Live Status & Station Boards
                                </p>
                            </div>
                            {/* Decorative Icon */}
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                overflow: 'hidden', background: '#F3F4F6'
                            }}>
                                <img src={trainIconImg} alt="Train" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>

                        {/* --- CONTENT SCROLL AREA --- */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

                            {/* SMART INPUT FIELD */}
                            <div style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '16px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                border: error ? '2px solid #FCA5A5' : '1px solid #F3F4F6',
                                marginBottom: '24px'
                            }}>
                                <Search size={24} color="#9CA3AF" strokeWidth={2.5} />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Enter train number or station name"
                                    style={{
                                        flex: 1, border: 'none', background: 'transparent',
                                        fontSize: '17px', fontWeight: '600', color: '#111',
                                        outline: 'none', padding: 0
                                    }}
                                    inputMode="text"
                                    autoComplete="off"
                                />
                            </div>

                            {loading && <GlobalLoader message="Fetching train status..." />}

                            {/* --- ERROR STATE --- */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        marginTop: '-12px', marginBottom: '20px',
                                        background: '#FEF2F2', color: '#B91C1C',
                                        padding: '12px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: '600',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}
                                >
                                    <AlertTriangle size={16} />
                                    {error}
                                </motion.div>
                            )}

                            {/* --- RESULTS AREA --- */}

                            {/* CASE 1: TRAIN STATUS RESULT */}
                            {trainData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {/* Inline Header for Context */}
                                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Live Status
                                        </div>
                                    </div>

                                    {/* Reusing the Dashboard Component */}
                                    <TrainStatusDashboard data={trainData} />

                                    {/* Extra Route Summary / Footer could go here */}
                                    <div style={{
                                        marginTop: '16px', textAlign: 'center',
                                        fontSize: '12px', color: '#9CA3AF'
                                    }}>
                                        Tap stations for platform info • Pull to refresh
                                    </div>
                                </motion.div>
                            )}

                            {/* CASE 2: STATION SUGGESTIONS (Autocomplete) */}
                            {suggestions.length > 0 && !trainData && !stationBoard && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', paddingLeft: '4px' }}>
                                        SUGGESTED STATIONS
                                    </div>
                                    {suggestions.map((station, idx) => (
                                        <motion.div
                                            key={station.code}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => handleStationSelect(station)}
                                            style={{
                                                background: 'white',
                                                padding: '12px 16px',
                                                borderRadius: '16px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                                                border: '1px solid #F3F4F6',
                                                cursor: 'pointer',
                                                marginBottom: '8px'
                                            }}
                                            whileTap={{ scale: 0.98, backgroundColor: '#F9FAFB' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '50%',
                                                    background: 'rgba(26, 115, 232, 0.1)', color: '#1A73E8',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <TrainFront size={22} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                                                        {station.name}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                                                        {station.aliases?.[0] || t('train.railway_station') || "Railway Station"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '6px 10px', background: '#F3F4F6', borderRadius: '8px',
                                                fontSize: '12px', fontWeight: 600, color: '#4B5563', letterSpacing: '0.5px'
                                            }}>
                                                {station.code}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* CASE 3: STATION BOARD (After Selection) */}
                            {stationBoard && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                        <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#111', margin: '0 0 4px 0' }}>
                                            {stationBoard.stationName}
                                        </h3>
                                        <div style={{
                                            display: 'inline-block', padding: '4px 10px',
                                            background: '#ECFDF5', color: '#059669',
                                            borderRadius: '20px', fontSize: '12px', fontWeight: 600
                                        }}>
                                            {stationBoard.stationCode}
                                        </div>
                                    </div>

                                    {/* TABS */}
                                    <div style={{
                                        display: 'flex', background: '#F3F4F6', padding: '4px',
                                        borderRadius: '12px', marginBottom: '16px'
                                    }}>
                                        {[
                                            { id: 'arriving', label: 'Arriving' },
                                            { id: 'departing', label: 'Departing' },
                                            { id: 'atStation', label: 'At Station' }
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => { setActiveBoardTab(tab.id); haptics.light(); }}
                                                style={{
                                                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                                                    cursor: 'pointer',
                                                    background: activeBoardTab === tab.id ? 'white' : 'transparent',
                                                    color: activeBoardTab === tab.id ? '#111' : '#6B7280',
                                                    fontWeight: 600, fontSize: '13px',
                                                    boxShadow: activeBoardTab === tab.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* LIST */}
                                    <div style={{
                                        background: 'white', borderRadius: '20px', overflow: 'hidden',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                                    }}>
                                        {stationBoard[activeBoardTab] && stationBoard[activeBoardTab].length > 0 ? (
                                            stationBoard[activeBoardTab].map((train, i) => (
                                                <TrainListItem key={i} train={train} />
                                            ))
                                        ) : (
                                            <div style={{
                                                padding: '40px', textAlign: 'center',
                                                color: '#9CA3AF', fontSize: '14px'
                                            }}>
                                                No trains {activeBoardTab === 'atStation' ? 'currently at station' : (activeBoardTab === 'arriving' ? 'arriving soon' : 'departing soon')}.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* EMPTY STATE (Initial) */}
                            {!query && !loading && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    paddingTop: '60px', opacity: 0.5
                                }}>
                                    <ArrowUp size={40} color="#9CA3AF" />
                                    <p style={{ marginTop: '16px', fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>
                                        Check live train status or<br />station arrivals instantly
                                    </p>
                                </div>
                            )}


                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Helper for empty state icon
const ArrowUp = ({ size, color }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);

export default TrainBookingSheet;
