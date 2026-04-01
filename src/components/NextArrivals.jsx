import React, { useState, useEffect } from 'react';
import busData from '../data/busData';
import { getDistance, ERODE_BUS_STAND_COORDS, ERODE_DISTRICT_CENTROID, ANTHIYUR_COORDS, VISIBILITY_RADIUS_METERS, DISTRICT_FALLBACK_RADIUS_METERS } from '../utils/locationUtils';
import { MapPin, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NextArrivals = ({ userAddress, userPosition, userDistrictInfo }) => {
    const { t } = useTranslation();
    // 📍 Detect District Logic (New)
    const [isInsideDistrict, setIsInsideDistrict] = useState(false);
    const [currentCity, setCurrentCity] = useState('Unknown');
    const [availableDistricts, setAvailableDistricts] = useState([]);
    const [manualDistrictSelection, setManualDistrictSelection] = useState(null);

    useEffect(() => {
        let detectedCity = 'Unknown';
        let insideErodeDistrict = false;
        let districts = [];

        // 1. Proximity Checks
        if (userPosition) {
            // Check Erode Proximity
            const distToErode = getDistance(userPosition.lat, userPosition.lng, ERODE_BUS_STAND_COORDS.lat, ERODE_BUS_STAND_COORDS.lng);
            if (distToErode <= 25000) { // 25km radius
                districts.push('Erode');
            }

            // Check Anthiyur Proximity
            const distToAnthiyur = getDistance(userPosition.lat, userPosition.lng, ANTHIYUR_COORDS.lat, ANTHIYUR_COORDS.lng);
            if (distToAnthiyur <= 25000) {
                districts.push('Anthiyur');
            }
        }

        // 2. Fallback: Administrative Check (if not detected by strict radius)
        if (districts.length === 0 && userDistrictInfo && userDistrictInfo.district) {
            const d = userDistrictInfo.district.toLowerCase();
            const s = userDistrictInfo.state ? userDistrictInfo.state.toLowerCase() : '';

            if (d.includes('erode') && s.includes('tamil nadu')) {
                // If in Erode district but not close to Anthiyur specific coords, default to Erode
                if (!districts.includes('Erode')) districts.push('Erode');
            } else if (d.includes('coimbatore')) {
                if (!districts.includes('Coimbatore')) districts.push('Coimbatore');
            } else if (d.includes('mettur') || d.includes('salem')) {
                if (!districts.includes('Mettur')) districts.push('Mettur');
            }
        }

        // 3. Fallback: Centroid Check for Erode
        if (districts.length === 0 && userPosition) {
            const distToCentroid = getDistance(
                userPosition.lat,
                userPosition.lng,
                ERODE_DISTRICT_CENTROID.lat,
                ERODE_DISTRICT_CENTROID.lng
            );
            if (distToCentroid <= DISTRICT_FALLBACK_RADIUS_METERS) {
                districts.push('Erode');
            }
        }

        // 4. Fallback: Address String
        if (districts.length === 0 && userAddress) {
            const addr = userAddress.toLowerCase();
            if (addr.includes('anthiyur')) {
                districts.push('Anthiyur');
            }
            if (addr.includes('erode')) {
                if (!districts.includes('Erode')) districts.push('Erode');
            } else if (addr.includes('coimbatore')) {
                districts.push('Coimbatore');
            } else if (addr.includes('mettur') || addr.includes('salem')) {
                districts.push('Mettur');
            }
        }

        setAvailableDistricts(districts);

        // Set Current City Logic
        // If manual selection is active and valid, use it
        if (manualDistrictSelection && districts.includes(manualDistrictSelection)) {
            setCurrentCity(manualDistrictSelection);
        } else {
            // Default Priority: Anthiyur -> Erode -> Others
            if (districts.includes('Anthiyur')) {
                setCurrentCity('Anthiyur');
            } else if (districts.includes('Erode')) {
                setCurrentCity('Erode');
            } else if (districts.length > 0) {
                setCurrentCity(districts[0]);
            } else {
                setCurrentCity('Unknown');
            }
        }

        setIsInsideDistrict(districts.length > 0);

    }, [userAddress, userPosition, userDistrictInfo, manualDistrictSelection]);


    const handleDistrictToggle = () => {
        if (currentCity === 'Anthiyur') setManualDistrictSelection('Erode');
        else if (currentCity === 'Erode') setManualDistrictSelection('Anthiyur');
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    // 🕒 Helper to Parse Time
    const parseTime = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier && modifier.toLowerCase() === 'pm') {
            hours = parseInt(hours, 10) + 12;
        } else if (modifier && modifier.toLowerCase() === 'am') {
            // Handle 12 AM edge case properly (already set to 00 if 12)
            // If not 12, keep as is
            if (hours !== '00') {
                hours = parseInt(hours, 10);
            }
        }

        return { hours: Number(hours), minutes: Number(minutes) };
    };

    // 🚌 Filter & Sort Routes
    const getUpcomingBuses = () => {
        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const totalCurrentMinutes = currentHours * 60 + currentMinutes;

        let filtered = [];

        if (currentCity === 'Anthiyur') {
            filtered = busData.filter(r => r.origin === 'Anthiyur' && r.destination === 'Erode');
        } else if (currentCity === 'Erode') {
            filtered = busData.filter(r => r.origin === 'Erode' && (r.destination === 'Coimbatore' || r.destination === 'Mettur' || r.destination === 'Sathyamangalam' || r.destination === 'Bengaluru'));
        } else if (currentCity === 'Coimbatore') {
            filtered = busData.filter(r => r.origin === 'Coimbatore' && r.destination === 'Erode');
        } else if (currentCity === 'Mettur') {
            filtered = busData.filter(r => r.origin === 'Mettur' && r.destination === 'Erode');
        } else {
            return [];
        }

        // Map to add 'minutesRemaining' and sort
        const scheduledBuses = filtered.map(bus => {
            const { hours, minutes } = parseTime(bus.time);
            const busTotalMinutes = hours * 60 + minutes;

            let diff = busTotalMinutes - totalCurrentMinutes;

            if (diff < -2) { // 2 min buffer to clear "Departed"
                diff += 24 * 60; // Show tomorrow's bus if today's is gone? 
                // Requirement check: "Show Next Arrivals". 
                // Usually we only show near future. 
                // If its 11PM and bus is 4AM, diff is negative, +1440 makes it positive large number.
            }

            return {
                ...bus,
                diffMinutes: diff,
                displayTime: bus.time
            };
        });

        // Sort by nearest time
        const futureBuses = scheduledBuses
            .filter(b => b.diffMinutes > -2 && b.diffMinutes < 180) // Only show buses within next 3 hours roughly to keep list relevant? Or just sort all.
            // Let's just sort and slice.
            .sort((a, b) => a.diffMinutes - b.diffMinutes)
            // Filter out "tomorrow" buses that are excessively far away if we want "Next Arrivals" for "Now"
            // But for late night users, tomorrow morning bus is relevant.
            .slice(0, 8); // Show next 8 buses

        return futureBuses;
    };

    const [upcomingBuses, setUpcomingBuses] = useState([]);

    // 🔄 Update Timer & List
    useEffect(() => {
        // Initial load
        setUpcomingBuses(getUpcomingBuses());

        const timer = setInterval(() => {
            setCurrentTime(new Date());
            setUpcomingBuses(getUpcomingBuses());
        }, 30000); // Update every 30s

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentCity]); // Re-run when city changes or timer ticks (managed by internal state update)

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
                .nonstop-badge {
                    padding: 3px 7px;
                    font-size: 11px;
                    white-space: nowrap;
                }
                @media (max-width: 380px) {
                    .nonstop-badge {
                        padding: 3px 6px;
                        font-size: 10.5px;
                    }
                }
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.3; }
                    100% { opacity: 1; }
                }
                .blink-text {
                    animation: blink 1s infinite ease-in-out;
                }
                `}
            </style>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', padding: '0 4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>{t('next_arrivals.title')}</h3>

                {currentCity !== 'Unknown' && (
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        onClick={availableDistricts.includes('Anthiyur') && availableDistricts.includes('Erode') ? handleDistrictToggle : undefined}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#F3F4F6',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            cursor: availableDistricts.includes('Anthiyur') && availableDistricts.includes('Erode') ? 'pointer' : 'default',
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

                        {availableDistricts.includes('Anthiyur') && availableDistricts.includes('Erode') && (
                            <motion.div
                                animate={{ rotate: currentCity === 'Anthiyur' ? 0 : 180 }}
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
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '16px 4px',
                                        borderBottom: '1px solid #F3F4F6',
                                        cursor: 'pointer'
                                    }}
                                >
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

                                                    {/* NON-STOP Badge */}
                                                    {bus.serviceType === 'Non-Stop' && (
                                                        <span className="nonstop-badge" style={{
                                                            fontWeight: '500',
                                                            color: '#6B7280',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '9999px',
                                                            background: 'transparent'
                                                        }}>
                                                            {t('next_arrivals.non_stop')}
                                                        </span>
                                                    )}

                                                    {/* VIA Badge */}
                                                    {bus.via && (
                                                        <span className="nonstop-badge" style={{
                                                            fontWeight: '500',
                                                            color: '#6B7280',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '9999px',
                                                            background: 'transparent'
                                                        }}>
                                                            via {bus.via}
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
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default NextArrivals;
