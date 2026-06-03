import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import haptics from '../utils/haptics';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

import busIconImg from '../assets/bus_hero_final.png';
import trainIconImg from '../assets/train_hero_final.png';
import EstimatedTimeDisplay from './EstimatedTimeDisplay';

// RAW SCHEDULE DATA (FULL SET)
const SCHEDULES = {
    'ANT-CBE': [
        { time: "05:00 AM", name: "A.S.M" },
        { time: "06:00 AM", name: "A.S.M" },
        { time: "07:45 AM", name: "A.S.M" },
        { time: "12:10 PM", name: "A.S.M" },
        { time: "08:20 PM", name: "A.S.M" }
    ],
    'CBE-ANT': [
        { time: "05:00 AM", name: "A.S.M" },
        { time: "06:00 AM", name: "A.S.M" },
        { time: "07:45 AM", name: "A.S.M" },
        { time: "12:10 PM", name: "A.S.M" },
        { time: "08:20 PM", name: "A.S.M" }
    ]
};

const RouteOptionsList = ({ routeStats, origin, destination, onStartNavigation, selectedRouteIndex, setSelectedRouteIndex, onRouteDetailsChange }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [currentTime, setCurrentTime] = React.useState(new Date());

    React.useEffect(() => {
        // Update every 30 seconds to keep "Departing" / "Departed" accurate
        const interval = setInterval(() => setCurrentTime(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    // ---------------------------------------------------------
    // REAL ROUTE DATA LOGIC (STRICT CITY CODES & TIME FILTERING)
    // ---------------------------------------------------------

    // 1. Normalize Google Places Input -> City Code
    const getCityCode = (input) => {
        if (!input) return null;

        // Handle Object or String
        const text = (typeof input === 'string' ? input : input?.name || '').toLowerCase();

        // CITY CODE MAPPING RULES (Check specific towns before district/city)
        if (text.includes('anthiyur') || text.includes('ant')) return 'ANT';
        if (text.includes('mettur') || text.includes('mett ur') || text.includes('mtr')) return 'MTR';
        if (text.includes('coimbatore') || text.includes('cbe')) return 'CBE';
        if (text.includes('erode') || text.includes('erd')) return 'ERD';

        return null;
    };

    // 2. Time Parser Helper
    const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period.toLowerCase() === 'pm' && hours !== 12) hours += 12;
        if (period.toLowerCase() === 'am' && hours === 12) hours = 0;

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };



    const getRoutes = React.useCallback((pOrigin, pDest) => {
        const originCode = getCityCode(pOrigin);
        const destCode = getCityCode(pDest);

        console.log("ROUTE LOOKUP:", {
            originInput: pOrigin, originCode,
            destInput: pDest, destCode
        });

        // Define route keys based on user rules
        let routeKey = null;
        let baseDuration = "45 mins";
        let defaultStops = "Standard";

        // 1. ANTHIYUR (ANT) -> COIMBATORE (CBE)
        if (originCode === 'ANT' && destCode === 'CBE') {
            routeKey = 'ANT-CBE';
            baseDuration = '2h 15m';
            defaultStops = 'Multiple';
        }
        // 2. COIMBATORE (CBE) -> ANTHIYUR (ANT)
        else if (originCode === 'CBE' && destCode === 'ANT') {
            routeKey = 'CBE-ANT';
            baseDuration = '2h 15m';
            defaultStops = 'Multiple';
        }

        if (!routeKey) return { options: [], isValidRoute: false, firstTripTime: null };

        const rawList = SCHEDULES[routeKey];
        const firstTripTime = rawList.length > 0 ? rawList[0].time : null;
        // Use the state currentTime for consistent rendering
        const now = currentTime;
        let foundNext = false; // Flag to identify the 'NEXT' bus after NOW/Departing



        // Time Filter & Labeling
        const futureList = rawList.map((item, idx) => {
            const itemTime = parseTime(item.time);
            return { ...item, parsedDate: itemTime, originalIdx: idx };
        }).filter(item => {
            // AUTO REMOVE AFTER 2 MINUTES Rule:
            // Keep if current time <= departureTime + 2 minutes
            // Rearranged: departureTime >= current time - 2 minutes
            // Diff = departure - current. Keep if Diff >= -2.
            const diffInMinutes = (item.parsedDate - now) / 60000;
            return diffInMinutes >= -2;
        });

        // Sort (should already be sorted but good to ensure)
        futureList.sort((a, b) => a.parsedDate - b.parsedDate);

        const mappedOptions = futureList.map((item) => {
            // "Name / Type" logic
            let finalName = item.name;
            let finalType = 'bus';
            let isGovt = false;
            let isAsm = item.name === "A.S.M";
            let isBookable = (routeKey === 'ANT-CBE' || routeKey === 'CBE-ANT') && isAsm;

            // MTR-ERD specific mapping
            if (routeKey === 'MTR-ERD') {
                if (item.name.toLowerCase().includes('govt')) {
                    finalName = t('route_list.govt_bus', 'Government Bus');
                    isGovt = true;
                } else if (item.name.toLowerCase().includes('private')) {
                    finalName = t('route_list.private_bus', 'Private Bus');
                    isGovt = false;
                }
            } else {
                // Heuristic for other routes
                if (item.name.toLowerCase().includes('tnstc') || item.name.toLowerCase().includes('setc')) {
                    isGovt = true;
                }
            }

            // Tag Logic
            let tag = 'REGULAR';
            let tagColor = '#F3F4F6'; // Grey
            let tagTextColor = '#4B5563';
            let isDeparted = false; // Flag to disable click
            let isBlinking = false; // Flag for animation

            const diffInMinutes = (item.parsedDate - now) / 60000;

            // STATUS LOGIC (STRICT)

            // 3. DEPARTED: timeDiff < 0 (and >= -2 due to filter)
            if (diffInMinutes < 0) {
                tag = 'DEPARTED';
                tagColor = '#FEE2E2'; // Red-100
                tagTextColor = '#991B1B'; // Red-800
                isDeparted = true;
                isBlinking = true;
            }
            // 2. DEPARTING: 0 < timeDiff <= 3
            else if (diffInMinutes >= 0 && diffInMinutes <= 3) {
                tag = 'DEPARTING';
                tagColor = '#FEF9C3'; // Yellow-100
                tagTextColor = '#854D0E'; // Yellow-800
            }
            // 1. Normal Future: timeDiff > 3
            else {
                // Priority Labels: NOW / NEXT
                // "NOW" rules usually imply "very soon". 
                // Let's say NOW is 3 < diff <= 20.
                if (diffInMinutes <= 20) {
                    tag = 'NOW';
                    tagColor = '#DCFCE7'; // Green
                    tagTextColor = '#15803d';
                } else if (!foundNext) {
                    tag = 'NEXT';
                    tagColor = '#DBEAFE'; // Blue
                    tagTextColor = '#1d4ed8';
                    foundNext = true;
                } else {
                    // Fallback
                    if (item.name.toLowerCase().includes('non-stop')) {
                        tag = 'FASTEST';
                        tagColor = '#E0F2FE';
                        tagTextColor = '#0284C7';
                    } else if (isGovt) {
                        tag = 'CHEAPEST';
                        tagColor = '#F3F4F6';
                        tagTextColor = '#4B5563';
                    } else {
                        tag = 'FREQUENT';
                        tagColor = '#FEF3C7';
                        tagTextColor = '#D97706';
                    }
                }
            }

            return {
                id: `${routeKey}-${item.originalIdx}`,
                type: finalType,
                isGovt: isGovt,
                isAsm: isAsm,
                isBookable: isBookable,
                tag: tag,
                tagColor: tagColor,
                tagTextColor: tagTextColor,
                isDeparted: isDeparted,     // For disabling click
                isBlinking: isBlinking,     // For UI animation
                routeNumber: finalName,
                duration: baseDuration,
                stops: defaultStops,
                departureTime: item.time,
                frequency: `${t('route_list.dep', 'Dep')}: ${item.time}`,
                subtext: isGovt ? t('route_list.state_transport', 'State Transport') : t('route_list.private_operator', 'Private Operator')
            };
        });

        return { options: mappedOptions, isValidRoute: true, firstTripTime };
    }, [currentTime, t]);

    const { options, isValidRoute, firstTripTime } = React.useMemo(
        () => getRoutes(origin, destination),
        [origin, destination, getRoutes]
    );

    // Sync selected route details up to parent whenever options or selected index changes
    React.useEffect(() => {
        if (options.length > 0 && selectedRouteIndex >= 0 && selectedRouteIndex < options.length) {
            const selectedOption = options[selectedRouteIndex];
            if (onRouteDetailsChange) {
                onRouteDetailsChange(selectedOption);
            }
        }
    }, [selectedRouteIndex, options, onRouteDetailsChange]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowX: 'hidden',
            width: 'calc(100% + 48px)', // Compensate for parent padding
            margin: '0 -24px', // Break out of parent padding
            padding: '0 24px' // Restore visual alignment
        }}>
            {/* List Title and Sub-header Info */}
            <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', textAlign: isRTL ? 'right' : 'left', marginBottom: '4px' }}>
                    {t('route_list.routes_available', 'Routes available')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#6B7280', textAlign: isRTL ? 'right' : 'left', fontWeight: 500 }}>
                        {routeStats?.distance || '107 km'} • {routeStats?.duration || '2h 21m'}
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                        {origin?.name?.split(',')[0] || origin || 'Origin'}
                        <ArrowRight size={10} color="#9CA3AF" />
                        {destination?.name?.split(',')[0] || destination || 'Destination'}
                    </div>
                </div>
            </div>

            {/* Cards List or Empty State */}
            {options.length > 0 ? (
                <>
                    {options.map((option, index) => {
                        const isSelected = selectedRouteIndex === index;
                        return (
                            <motion.div
                                key={option.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (option.isDeparted) return; // Disable click if departed
                                    haptics.light();
                                    setSelectedRouteIndex(index);
                                }}
                                style={{
                                    borderRadius: '16px',
                                    padding: '16px',
                                    cursor: option.isDeparted ? 'default' : 'pointer', // Disable cursor if departed
                                    opacity: option.isDeparted ? 0.6 : 1, // Visual cue for departed
                                    position: 'relative',
                                    backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    willChange: 'transform'
                                }}
                            >


                                {/* Right Side: Large 3D Icon (Hero) - Layered Behind */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: isRTL ? 'auto' : '-40px',
                                        left: isRTL ? '-40px' : 'auto',
                                        top: 'calc(50% - 10px)', // moved up by 10px
                                        transform: 'translateY(-50%)',
                                        width: '115px',
                                        height: '88px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 0, // Behind text
                                        pointerEvents: 'none'
                                    }}
                                >
                                    <img
                                        src={option.type === 'bus' ? busIconImg : trainIconImg}
                                        alt={option.type}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </div>

                                {/* Left Side: Route Details - Layered Above */}
                                <div style={{
                                    flex: 1,
                                    paddingRight: isRTL ? '0' : '90px',
                                    paddingLeft: isRTL ? '90px' : '0',
                                    zIndex: 2,
                                    position: 'relative',
                                    textAlign: isRTL ? 'right' : 'left'
                                }}>
                                    {/* Tag */}
                                    <motion.div
                                        animate={option.isBlinking ? { opacity: [1, 0.5, 1] } : {}}
                                        transition={option.isBlinking ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                                        style={{
                                            display: 'inline-block',
                                            background: option.tagColor,
                                            color: option.tagTextColor,
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '6px'
                                        }}>
                                        {option.tag}
                                    </motion.div>

                                    {/* Title & Subtext */}
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {option.routeNumber}
                                        {option.isBookable && (
                                            <span style={{
                                                fontSize: '10px',
                                                background: '#10B981',
                                                color: 'white',
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                textTransform: 'uppercase'
                                            }}>
                                                BOOKING AVAILABLE
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '10px' }}>
                                        {option.subtext}
                                    </div>

                                    {/* Footer Stats */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} color="#374151" />
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{option.duration}</span>
                                        </div>
                                        <div style={{ width: '3px', height: '3px', background: '#D1D5DB', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '13px', color: '#4B5563' }}>{option.stops}</span>
                                        <div style={{ width: '3px', height: '3px', background: '#D1D5DB', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '13px', color: '#4B5563', fontStyle: 'italic' }}>
                                            {option.frequency.includes(option.departureTime) ? (
                                                <>
                                                    {option.frequency.split(option.departureTime)[0].replace(t('route_list.every', 'Every') + ' ', '')}
                                                    <EstimatedTimeDisplay time={option.departureTime} />
                                                    {option.frequency.split(option.departureTime)[1]}
                                                </>
                                            ) : (
                                                option.frequency.replace(t('route_list.every', 'Every') + ' ', '')
                                            )}
                                        </span>
                                    </div>

                                    {/* A.S.M Call to Action removed as requested */}
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Start Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            haptics.light();
                            onStartNavigation();
                        }}
                        style={{
                            marginTop: '8px',
                            width: '100%',
                            background: '#2563EB', // Blue primary color
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '16px',
                            height: '52px',
                            borderRadius: '26px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', // Blue tinted shadow
                            transition: 'transform 0.1s ease'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Start Journey
                        {/* <ArrowRight size={18} /> */}
                    </motion.button>
                </>
            ) : isValidRoute ? (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: '24px',
                    color: '#6B7280',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: '#F3F4F6',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '8px'
                    }}>
                        <Clock size={28} color="#9CA3AF" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Trip Completed
                    </h3>
                    <p style={{ fontSize: '14px', margin: 0, color: '#4B5563', fontWeight: 500 }}>
                        All buses for today have departed.
                    </p>
                    <div style={{
                        marginTop: '8px',
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'inline-block'
                    }}>
                        Next trip tomorrow at <EstimatedTimeDisplay time={firstTripTime} />
                    </div>
                </div>
            ) : (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: '24px',
                    color: '#6B7280'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                        Route is under development
                    </h3>
                    <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                        We currently only serve Anthiyur ↔ Coimbatore.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RouteOptionsList;
