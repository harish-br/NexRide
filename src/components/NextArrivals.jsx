import React, { useState, useEffect, useMemo } from 'react';
import { getDistance, SOURCE_COORDINATES } from '../utils/locationUtils';
import { MapPin, ArrowUpDown, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { busService } from '../services/busService';
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
                            {operatorName} <span style={{ fontSize: '14px', fontWeight: 500, color: '#6B7280' }}>| {bus.displayTime}</span>
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#4B5563' }}>
                                {bus.from} → {bus.to}
                            </span>

                            {/* GOVT Badge */}
                            {busType === 'Govt' && (
                                <span style={{
                                    fontSize: '11px', fontWeight: '600', color: '#059669',
                                    background: '#D1FAE5', border: '1px solid #A7F3D0',
                                    borderRadius: '9999px', padding: '2px 8px'
                                }}>
                                    {t('next_arrivals.govt')}
                                </span>
                            )}

                            {/* PRIVATE Badge */}
                            {busType === 'Private' && (
                                <span style={{
                                    fontSize: '11px', fontWeight: '600', color: '#4B5563',
                                    background: '#F3F4F6', border: '1px solid #E5E7EB',
                                    borderRadius: '9999px', padding: '2px 8px'
                                }}>
                                    {t('next_arrivals.private')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: ETA & Status */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '90px' }}>
                    <div style={{
                        fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '2px'
                    }}>
                        {status.sub}
                    </div>
                    {status.label && (
                        <div style={{
                            fontSize: '12px', fontWeight: 700,
                            color: status.color
                        }}>
                            {status.label}
                        </div>
                    )}
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
    const [buses, setBuses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1. Determine nearby bus stands based on GPS
    useEffect(() => {
        let nearby = [];

        if (userPosition) {
            Object.entries(SOURCE_COORDINATES).forEach(([name, coords]) => {
                const dist = getDistance(userPosition.lat, userPosition.lng, coords.lat, coords.lng);
                if (dist <= 30000) { // 30km radius for "Nearby"
                    nearby.push({ name, dist });
                }
            });
        }

        // Fallback checks omitted for brevity but can be added back if needed

        nearby.sort((a, b) => a.dist - b.dist);
        const sourceNames = nearby.map(n => n.name);
        setAvailableNearbySources(sourceNames);

        if (manualSourceSelection && sourceNames.includes(manualSourceSelection)) {
            setCurrentCity(manualSourceSelection);
        } else if (sourceNames.length > 0) {
            setCurrentCity(sourceNames[0]);
        } else {
            setCurrentCity('Unknown');
        }
    }, [userAddress, userPosition, userDistrictInfo, manualSourceSelection]);

    // 2. Fetch buses from Firestore when currentCity changes
    useEffect(() => {
        const fetchBuses = async () => {
            if (currentCity === 'Unknown') {
                setBuses([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const fetchedBuses = await busService.getArrivalsBySource(currentCity);
                setBuses(fetchedBuses);
            } catch (error) {
                console.error("Failed to fetch buses from Firestore:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBuses();
    }, [currentCity]);

    const handleSourceToggle = () => {
        if (availableNearbySources.length <= 1) return;
        const currentIndex = availableNearbySources.indexOf(currentCity);
        const nextIndex = (currentIndex + 1) % availableNearbySources.length;
        setManualSourceSelection(availableNearbySources[nextIndex]);
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    // 🚌 Filter & Sort Routes
    const upcomingBuses = useMemo(() => {
        if (currentCity === 'Unknown' || buses.length === 0) return [];

        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const toMinutes = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        return buses
            .map(bus => {
                const busMinutes = toMinutes(bus.departureTime);
                let diff = busMinutes - currentTotalMinutes;

                if (diff < -5) { // 5 min buffer to clear "Departed"
                    diff += 24 * 60; // Show tomorrow's bus if today's is gone
                }

                return {
                    ...bus,
                    diffMinutes: diff,
                    displayTime: bus.departureTime,
                };
            })
            .filter(b => b.diffMinutes > -5)
            .sort((a, b) => a.diffMinutes - b.diffMinutes)
            .slice(0, 15);
    }, [buses, currentCity]);

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
        if (bus.operatorName && bus.operatorName.toUpperCase().includes('TNSTC')) return 'Govt';
        if (bus.serviceType === 'Govt') return 'Govt';
        return 'Private';
    };

    // Helper to format Operator Name (Cleaner now)
    const formatOperator = (bus) => {
        if (bus.operatorName) {
            if (bus.operatorName.toUpperCase().includes('TNSTC')) return 'TNSTC';
            return bus.operatorName;
        }
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
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                            <div className="animate-spin" style={{
                                width: '24px', height: '24px', border: '2px solid #F3F4F6',
                                borderTopColor: '#3B82F6', borderRadius: '50%', margin: '0 auto 12px'
                            }}></div>
                            <span>Searching schedules...</span>
                        </div>
                    ) : upcomingBuses.length === 0 ? (
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
