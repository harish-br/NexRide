import React, { useState, useEffect } from 'react';
import { getDistance, SOURCE_COORDINATES } from '../utils/locationUtils';
import { MapPin, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { busSchedules } from '../data/busSchedules';
import haptics from '../utils/haptics';

const ArrivalCard = ({ bus, status, operatorName, busType, t }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Split via string into stops if it exists
    const routeStops = bus.via ? bus.via.split(',').map(s => s.trim()) : [];

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 4px',
                borderBottom: '1px solid #F3F4F6',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left: Icon + Bus Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '8px',
                        background: '#F3F4F6', overflow: 'hidden'
                    }}>
                        <img
                            src="/icons/bus_icon_minimal.jpg"
                            alt="Bus"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                            {operatorName} <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>| {bus.displayTime}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                {bus.origin} → {bus.destination}
                            </span>

                            <div className="badge-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '65%', alignItems: 'center' }}>
                                {/* GOVT Badge */}
                                {busType === 'Govt' && (
                                    <span style={{
                                        fontSize: '12px', fontWeight: '500', color: '#065F46',
                                        background: '#ECFDF5', border: '1px solid #A7F3D0',
                                        borderRadius: '9999px', padding: '4px 8px', whiteSpace: 'nowrap'
                                    }}>
                                        {t('next_arrivals.govt')}
                                    </span>
                                )}

                                {/* PRIVATE Badge */}
                                {busType === 'Private' && (
                                    <span style={{
                                        fontSize: '12px', fontWeight: '500', color: '#1F2937',
                                        background: '#F3F4F6', border: '1px solid #E5E7EB',
                                        borderRadius: '9999px', padding: '4px 8px', whiteSpace: 'nowrap'
                                    }}>
                                        {t('next_arrivals.private')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: ETA & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px', flexShrink: 0 }}>
                    <div style={{
                        fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px'
                    }}>
                        {status.sub}
                    </div>
                    <div style={{
                        fontSize: '12px', fontWeight: 700,
                        color: status.color
                    }}>
                        {status.label}
                    </div>
                </div>
            </div>

            {/* NEW: Expandable Via Route Section */}
            {routeStops.length > 0 && (
                <div style={{ marginTop: '10px', paddingLeft: '56px' }}>
                    <button
                        onClick={() => {
                            haptics.light();
                            setIsExpanded(!isExpanded);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                            {t('next_arrivals.via_route')}
                        </span>
                        <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronRight size={14} color="#9CA3AF" />
                        </motion.div>
                    </button>
                    
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ 
                                    paddingTop: '6px', 
                                    fontSize: '12px', 
                                    color: '#9CA3AF', 
                                    fontWeight: '400',
                                    lineHeight: '1.5'
                                }}>
                                    {t('next_arrivals.via')} {routeStops.join(", ")}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

const NextArrivals = ({ userAddress, userPosition, userDistrictInfo }) => {
    const { t } = useTranslation();
    const [currentCity, setCurrentCity] = useState('Unknown');
    const [availableNearbySources, setAvailableNearbySources] = useState([]);
    const [manualSourceSelection, setManualSourceSelection] = useState(null);

    useEffect(() => {
        let nearby = [];
        
        // 1. Proximity Check for all known sources
        if (userPosition) {
            Object.entries(SOURCE_COORDINATES).forEach(([name, coords]) => {
                const dist = getDistance(userPosition.lat, userPosition.lng, coords.lat, coords.lng);
                if (dist <= 30000) { // 30km radius for "Nearby"
                    nearby.push({ name, dist });
                }
            });
        }

        // 2. Fallback: District Check
        if (nearby.length === 0 && userDistrictInfo && userDistrictInfo.district) {
            const district = userDistrictInfo.district.toLowerCase();
            Object.entries(SOURCE_COORDINATES).forEach(([name, coords]) => {
                if (coords.district.toLowerCase().includes(district)) {
                    nearby.push({ name, dist: 50000 }); // Default distance for district match
                }
            });
        }

        // 3. Fallback: Address String
        if (nearby.length === 0 && userAddress) {
            const addr = userAddress.toLowerCase();
            Object.entries(SOURCE_COORDINATES).forEach(([name, coords]) => {
                if (addr.includes(name.toLowerCase())) {
                    nearby.push({ name, dist: 10000 });
                }
            });
        }

        // Sort by distance
        nearby.sort((a, b) => a.dist - b.dist);
        const sourceNames = nearby.map(n => n.name);
        setAvailableNearbySources(sourceNames);

        // Set Current City
        if (manualSourceSelection && sourceNames.includes(manualSourceSelection)) {
            setCurrentCity(manualSourceSelection);
        } else if (sourceNames.length > 0) {
            setCurrentCity(sourceNames[0]);
        } else {
            setCurrentCity('Unknown');
        }

    }, [userAddress, userPosition, userDistrictInfo, manualSourceSelection]);

    const handleSourceToggle = () => {
        if (availableNearbySources.length <= 1) return;
        const currentIndex = availableNearbySources.indexOf(currentCity);
        const nextIndex = (currentIndex + 1) % availableNearbySources.length;
        setManualSourceSelection(availableNearbySources[nextIndex]);
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    // 🕒 Helper to Parse Time
    const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');

        if (modifier && modifier.toLowerCase() === 'pm' && hours !== '12') {
            hours = parseInt(hours, 10) + 12;
        } else if (modifier && modifier.toLowerCase() === 'am' && hours === '12') {
            hours = 0;
        } else {
            hours = parseInt(hours, 10);
        }

        return { hours: Number(hours), minutes: Number(minutes) };
    };

    // 🚌 Filter & Sort Routes
    const getUpcomingBuses = () => {
        if (currentCity === 'Unknown') return [];

        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        // Filter busSchedules for the current city
        const filtered = busSchedules.filter(r => r.from === currentCity);

        // Map to add 'minutesRemaining' and sort
        const scheduledBuses = filtered.map(bus => {
            const { hours, minutes } = parseTime(bus.departureTime);
            const busTotalMinutes = hours * 60 + minutes;

            let diff = busTotalMinutes - currentTotalMinutes;

            if (diff < -5) { // 5 min buffer to clear "Departed"
                diff += 24 * 60; // Show tomorrow's bus if today's is gone
            }

            return {
                ...bus,
                diffMinutes: diff,
                displayTime: bus.departureTime,
                origin: bus.from,
                destination: bus.to,
                operator: bus.operatorName
            };
        });

        // Sort and slice
        const futureBuses = scheduledBuses
            .filter(b => b.diffMinutes > -5)
            .sort((a, b) => a.diffMinutes - b.diffMinutes)
            .slice(0, 15); // Show more buses from the comprehensive list

        return futureBuses;
    };

    const [upcomingBuses, setUpcomingBuses] = useState([]);

    useEffect(() => {
        setUpcomingBuses(getUpcomingBuses());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setUpcomingBuses(getUpcomingBuses());
        }, 30000);
        return () => clearInterval(timer);
    }, [currentCity]);

    // 🕒 Format ETA Helper (JSX with Visual Priority)
    const FormatETA = ({ totalMinutes }) => {
        if (totalMinutes < 60) {
            return (
                <span>
                    <span style={{ fontWeight: 800 }}>{totalMinutes}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>{t('next_arrivals.min')}</span>
                </span>
            );
        }
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (minutes === 0) {
            return (
                <span>
                    <span style={{ fontWeight: 800 }}>{hours}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>{t('next_arrivals.hr')}</span>
                </span>
            );
        }

        return (
            <span>
                <span style={{ fontWeight: 800 }}>{hours}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>{t('next_arrivals.hr')}</span>
                <span style={{ display: 'inline-block', width: '4px' }}></span>
                <span style={{ opacity: 0.9, fontWeight: 600 }}>
                    <span style={{ fontWeight: 800 }}>{minutes}</span> <span style={{ fontSize: '0.85em', fontWeight: 500 }}>{t('next_arrivals.min')}</span>
                </span>
            </span>
        );
    };

    const getStatusInfo = (diff) => {
        if (diff <= 0) {
            return {
                label: null,
                color: '#9CA3AF',
                sub: <span className="blink-text" style={{ color: '#9CA3AF', fontWeight: 800 }}>{t('next_arrivals.departed')}</span>
            };
        } else if (diff <= 3) {
            return {
                label: null,
                color: '#F97316', // Orange 500
                sub: <span style={{ color: '#F97316', fontWeight: 700 }}>{t('next_arrivals.departing')}</span>
            };
        } else {
            return {
                label: t('next_arrivals.on_time'),
                color: '#16A34A',
                sub: <FormatETA totalMinutes={diff} />
            };
        }
    };

    // Helper to get Bus Type
    const getBusType = (bus) => {
        if (bus.operator && bus.operator.toUpperCase().includes('TNSTC')) return 'Govt';
        if (bus.operatorType === 'Govt') return 'Govt';
        return 'Private';
    };

    // Helper to format Operator Name (Cleaner now)
    const formatOperator = (bus) => {
        if (bus.operator) {
            if (bus.operator.toUpperCase().includes('TNSTC')) return 'TNSTC'; // Removed (Govt) text
            return bus.operator;
        }
        if (bus.operatorType === 'Govt') return 'TNSTC';
        if (bus.operatorType === 'Private') return 'Private Bus';
        return 'Bus';
    };

    return (
        <div>
            <style>
                {`
                .blink-text {
                    animation: blink 1s infinite ease-in-out;
                }
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
                `}
            </style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{t('next_arrivals.title')}</h3>

                {currentCity !== 'Unknown' && (
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        onClick={availableNearbySources.length > 1 ? handleSourceToggle : undefined}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#F3F4F6',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            cursor: availableNearbySources.length > 1 ? 'pointer' : 'default',
                            userSelect: 'none'
                        }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentCity}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}
                            >
                                {t('next_arrivals.from_city', { city: currentCity })}
                            </motion.span>
                        </AnimatePresence>

                        {availableNearbySources.length > 1 && (
                            <motion.div
                                animate={{ rotate: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: 'flex', alignItems: 'center', color: '#6B7280' }}
                            >
                                <ArrowUpDown size={14} />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Outside Range Message */}
            {currentCity === 'Unknown' && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px', background: '#F9FAFB', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={24} color="#9CA3AF" />
                    <p style={{ margin: 0 }}>{t('next_arrivals.outside_range')}</p>
                </div>
            )}

            {currentCity !== 'Unknown' && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '400px', // Restrict height to enable scrolling
                    overflowY: 'auto',  // Enable vertical scrolling
                    paddingRight: '4px' // Prevent content from hiding behind scrollbar if overlay
                }}>
                    {upcomingBuses.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '14px', background: '#F9FAFB', borderRadius: '12px' }}>
                            {t('next_arrivals.no_buses')}
                        </div>
                    ) : (
                        upcomingBuses.map((bus, index) => {
                            const status = getStatusInfo(bus.diffMinutes);
                            const operatorName = formatOperator(bus);
                            const busType = getBusType(bus);

                            return (
                                <ArrivalCard 
                                    key={index} 
                                    bus={bus} 
                                    status={status} 
                                    operatorName={operatorName} 
                                    busType={busType} 
                                    t={t} 
                                />
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default NextArrivals;
