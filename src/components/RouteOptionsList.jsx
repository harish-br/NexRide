import React from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import haptics from '../utils/haptics';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

import busIconImg from '../assets/bus_hero_final.png';
import trainIconImg from '../assets/train_hero_final.png';

const RouteOptionsList = ({ routeStats, origin, destination, onStartNavigation, selectedRouteIndex, setSelectedRouteIndex }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    // ------------------------------------------------------------
    // REAL-TIME CLOCK FOR STATUS UPDATES
    // ------------------------------------------------------------
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

        // CITY CODE MAPPING RULES
        if (text.includes('erode') || text.includes('erd')) return 'ERD';
        if (text.includes('coimbatore') || text.includes('cbe')) return 'CBE';
        if (text.includes('mettur') || text.includes('mett ur') || text.includes('mtr')) return 'MTR';

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

    // RAW SCHEDULE DATA (FULL SET)
    const SCHEDULES = {
        'ERD-CBE': [
            { time: "4:45 AM", name: "Raja" }, { time: "5:20 AM", name: "Raja" }, { time: "6:00 AM", name: "TNSTC (Non-Stop)" },
            { time: "6:00 AM", name: "KKC" }, { time: "6:15 AM", name: "TNSTC (Non-Stop)" }, { time: "6:25 AM", name: "BBS" },
            { time: "6:30 AM", name: "TNSTC (Non-Stop)" }, { time: "6:40 AM", name: "MSM" }, { time: "6:50 AM", name: "LNT" },
            { time: "7:00 AM", name: "TNSTC (Non-Stop)" }, { time: "7:12 AM", name: "SCP" }, { time: "7:28 AM", name: "Nataraja" },
            { time: "7:30 AM", name: "SNB" }, { time: "7:55 AM", name: "TNSTC (Non-Stop)" }, { time: "8:05 AM", name: "TSR" },
            { time: "8:20 AM", name: "TNSTC (Non-Stop)" }, { time: "8:35 AM", name: "VMP" }, { time: "8:45 AM", name: "TNSTC (Non-Stop)" },
            { time: "8:55 AM", name: "TNSTC (Non-Stop)" }, { time: "9:10 AM", name: "SCP" }, { time: "9:30 AM", name: "TNSTC (Non-Stop)" },
            { time: "9:55 AM", name: "TNSTC (Non-Stop)" }, { time: "10:00 AM", name: "Raja" }, { time: "10:30 AM", name: "TNSTC (Non-Stop)" },
            { time: "10:50 AM", name: "Raja" }, { time: "11:00 AM", name: "TNSTC (Non-Stop)" }, { time: "11:28 AM", name: "KKC" },
            { time: "11:30 AM", name: "TNSTC (Non-Stop)" }, { time: "12:00 PM", name: "LNT" }, { time: "1:15 PM", name: "TNSTC (Non-Stop)" },
            { time: "2:20 PM", name: "TNSTC (Non-Stop)" }, { time: "2:45 PM", name: "TNSTC (Non-Stop)" }, { time: "3:15 PM", name: "TNSTC (Non-Stop)" },
            { time: "3:45 PM", name: "TNSTC (Non-Stop)" }, { time: "4:15 PM", name: "TNSTC (Non-Stop)" }, { time: "4:45 PM", name: "TNSTC (Non-Stop)" },
            { time: "6:40 PM", name: "TNSTC (Non-Stop)" }, { time: "8:20 PM", name: "TNSTC (Non-Stop)" }
        ],
        'CBE-ERD': [
            { time: "6:25 AM", name: "TNSTC NON-STOP" }, { time: "7:25 AM", name: "TNSTC NON-STOP" }, { time: "8:15 AM", name: "TNSTC NON-STOP" },
            { time: "8:40 AM", name: "TNSTC NON-STOP" }, { time: "9:30 AM", name: "TNSTC NON-STOP" }, { time: "10:20 AM", name: "TNSTC NON-STOP" },
            { time: "11:25 AM", name: "TNSTC NON-STOP" }, { time: "12:05 PM", name: "TNSTC NON-STOP" }, { time: "12:35 PM", name: "SCP" },
            { time: "12:45 PM", name: "TNSTC NON-STOP" }, { time: "1:00 PM", name: "TNSTC NON-STOP" }, { time: "1:18 PM", name: "MSM" },
            { time: "1:30 PM", name: "TNSTC NON-STOP" }, { time: "1:45 PM", name: "BBS" }, { time: "2:00 PM", name: "TNSTC NON-STOP" },
            { time: "2:15 PM", name: "SCP" }, { time: "2:50 PM", name: "SRS" }, { time: "3:00 PM", name: "TSR" },
            { time: "4:00 PM", name: "TNSTC NON-STOP" }, { time: "4:00 PM", name: "SNB" }, { time: "4:15 PM", name: "MSM" },
            { time: "4:15 PM", name: "Raja" }, { time: "4:25 PM", name: "TNSTC NON-STOP" }, { time: "4:45 PM", name: "SCP" },
            { time: "4:50 PM", name: "Raja" }, { time: "4:55 PM", name: "BBS" }, { time: "5:20 PM", name: "SCP" },
            { time: "5:30 PM", name: "TNSTC NON-STOP" }, { time: "5:35 PM", name: "SRS" }, { time: "5:40 PM", name: "LNT" },
            { time: "5:45 PM", name: "TNSTC NON-STOP" }, { time: "5:55 PM", name: "TSR" }, { time: "6:10 PM", name: "TNSTC NON-STOP" },
            { time: "6:15 PM", name: "KKC" }, { time: "6:25 PM", name: "TNSTC NON-STOP" }, { time: "6:35 PM", name: "SNB" },
            { time: "6:40 PM", name: "TNSTC NON-STOP" }, { time: "6:48 PM", name: "MSM" }, { time: "6:55 PM", name: "TNSTC NON-STOP" },
            { time: "7:15 PM", name: "TNSTC NON-STOP" }, { time: "7:15 PM", name: "SCP" }, { time: "7:28 PM", name: "Raja" },
            { time: "7:38 PM", name: "BBS" }, { time: "7:45 PM", name: "Raja" }, { time: "8:05 PM", name: "SCP" },
            { time: "8:15 PM", name: "Nataraja" }, { time: "8:20 PM", name: "TNSTC NON-STOP" }, { time: "8:30 PM", name: "LNT" },
            { time: "8:30 PM", name: "TSR" }, { time: "8:50 PM", name: "KCC" }, { time: "9:45 PM", name: "MSM" },
            { time: "10:15 PM", name: "BBS" }, { time: "10:35 PM", name: "SCP" }, { time: "10:40 PM", name: "SCP" }
        ],
        'ERD-MTR': [
            { time: "12:20 AM", name: "KR&Co" }, { time: "01:50 AM", name: "SVT" }, { time: "02:00 AM", name: "Saraswathi" },
            { time: "02:09 AM", name: "RKM" }, { time: "02:40 AM", name: "KMS" }, { time: "03:04 AM", name: "KMS" },
            { time: "03:30 AM", name: "BBS" }, { time: "03:40 AM", name: "KR&Co" }, { time: "03:50 AM", name: "Thirumagal" },
            { time: "04:15 AM", name: "BBS" }, { time: "04:30 AM", name: "Thirumagal" }, { time: "04:35 AM", name: "Thirumagal" },
            { time: "04:44 AM", name: "SMT" }, { time: "04:50 AM", name: "KAS" }, { time: "04:50 AM", name: "KMS" },
            { time: "04:52 AM", name: "RVT" }, { time: "05:22 AM", name: "Saraswathi" }, { time: "05:27 AM", name: "KAS" },
            { time: "05:31 AM", name: "KR&Co" }, { time: "05:38 AM", name: "RKM" }, { time: "05:45 AM", name: "RVT" },
            { time: "06:17 AM", name: "Saraswathi" }, { time: "06:33 AM", name: "KMS" }, { time: "06:40 AM", name: "BBS" },
            { time: "07:00 AM", name: "NRL" }, { time: "07:10 AM", name: "SVT" }, { time: "07:15 AM", name: "KMS" },
            { time: "07:43 AM", name: "KR&Co" }, { time: "07:55 AM", name: "KR&Co" }, { time: "08:05 AM", name: "KR&Co" },
            { time: "08:15 AM", name: "SVT" }, { time: "08:25 AM", name: "Thirumagal" }, { time: "08:42 AM", name: "KR&Co" },
            { time: "08:55 AM", name: "SMT" }, { time: "08:58 AM", name: "KAS" }, { time: "09:00 AM", name: "KR&Co" },
            { time: "09:25 AM", name: "KMS" }, { time: "09:30 AM", name: "NRL" }, { time: "09:35 AM", name: "KR&Co" },
            { time: "09:38 AM", name: "Saraswathi" }, { time: "09:38 AM", name: "SMT" }, { time: "10:04 AM", name: "Thirumagal" },
            { time: "10:18 AM", name: "RKM" }, { time: "10:43 AM", name: "Thirumagal" }, { time: "10:50 AM", name: "KMS" },
            { time: "11:07 AM", name: "KMS" }, { time: "11:19 AM", name: "RVT" }, { time: "11:32 AM", name: "KR&Co" },
            { time: "11:53 AM", name: "BBS" }, { time: "12:44 PM", name: "KR&Co" }, { time: "12:57 PM", name: "KR&Co" },
            { time: "01:13 PM", name: "SMT" }, { time: "01:30 PM", name: "KR&Co" }, { time: "02:09 PM", name: "RKM" },
            { time: "03:40 PM", name: "KR&Co" }, { time: "03:50 PM", name: "Thirumagal" }, { time: "04:15 PM", name: "BBS" },
            { time: "04:30 PM", name: "Thirumagal" }, { time: "04:44 PM", name: "SMT" }, { time: "04:50 PM", name: "KMS" },
            { time: "04:52 PM", name: "RVT" }, { time: "05:31 PM", name: "KR&Co" }, { time: "05:38 PM", name: "RKM" },
            { time: "06:17 PM", name: "Saraswathi" }, { time: "06:33 PM", name: "KMS" }, { time: "07:00 PM", name: "NRL" },
            { time: "07:10 PM", name: "SVT" }, { time: "07:15 PM", name: "KMS" }, { time: "07:43 PM", name: "KR&Co" },
            { time: "08:05 PM", name: "KR&Co" }, { time: "08:25 PM", name: "Thirumagal" }, { time: "08:55 PM", name: "SMT" },
            { time: "09:00 PM", name: "KR&Co" }, { time: "10:00 PM", name: "KR&Co" }, { time: "10:25 PM", name: "RKM" }
        ],
        'MTR-ERD': [
            { time: "12:15 am", name: "Govt" }, { time: "1:05 am", name: "Govt" }, { time: "3:00 am", name: "Private" },
            { time: "3:15 am", name: "Private" }, { time: "3:45 am", name: "Private" }, { time: "4:00 am", name: "Govt" },
            { time: "4:35 am", name: "Govt" }, { time: "4:55 am", name: "Govt" }, { time: "5:00 am", name: "Govt" },
            { time: "5:10 am", name: "Private" }, { time: "5:23 am", name: "Govt" }, { time: "5:45 am", name: "Govt" },
            { time: "6:00 am", name: "Private" }, { time: "6:11 am", name: "Private" }, { time: "6:25 am", name: "Private" },
            { time: "6:40 am", name: "Govt" }, { time: "6:49 am", name: "Private" }, { time: "6:59 am", name: "Private" },
            { time: "7:13 am", name: "Private" }, { time: "7:18 am", name: "Govt" }, { time: "7:23 am", name: "Govt" },
            { time: "7:25 am", name: "Private" }, { time: "7:35 am", name: "Private" }, { time: "7:43 am", name: "Private" },
            { time: "7:45 am", name: "Govt" }, { time: "7:48 am", name: "Govt" }, { time: "7:58 am", name: "Private" },
            { time: "8:03 am", name: "Govt" }, { time: "8:07 am", name: "Private" }, { time: "8:08 am", name: "Private" },
            { time: "8:13 am", name: "Govt" }, { time: "8:20 am", name: "Govt" }, { time: "8:30 am", name: "Govt" },
            { time: "8:33 am", name: "Private" }, { time: "8:38 am", name: "Govt" }, { time: "8:45 am", name: "Private" },
            { time: "8:55 am", name: "Private" }, { time: "9:08 am", name: "Private" }, { time: "9:18 am", name: "Govt" },
            { time: "9:45 am", name: "Govt" }, { time: "9:50 am", name: "Govt" }, { time: "10:25 am", name: "Govt" },
            { time: "10:30 am", name: "Govt" }, { time: "10:36 am", name: "Govt" }, { time: "11:24 am", name: "Govt" },
            { time: "11:40 am", name: "Govt" }, { time: "11:48 am", name: "Govt" }, { time: "12:20 pm", name: "Govt" },
            { time: "12:25 pm", name: "Govt" }, { time: "12:36 pm", name: "Govt" }, { time: "12:51 pm", name: "Govt" },
            { time: "1:14 pm", name: "Govt" }, { time: "1:22 pm", name: "Govt" }, { time: "1:50 pm", name: "Govt" },
            { time: "1:58 pm", name: "Govt" }, { time: "2:12 pm", name: "Govt" }, { time: "2:21 pm", name: "Govt" },
            { time: "3:27 pm", name: "Govt" }, { time: "3:35 pm", name: "Govt" }, { time: "4:05 pm", name: "Govt" },
            { time: "4:16 pm", name: "Govt" }, { time: "4:25 pm", name: "Govt" }, { time: "4:33 pm", name: "Govt" },
            { time: "5:00 pm", name: "Govt" }, { time: "5:05 pm", name: "Govt" }, { time: "5:20 pm", name: "Govt" },
            { time: "5:27 pm", name: "Govt" }, { time: "5:40 pm", name: "Govt" }, { time: "5:48 pm", name: "Govt" },
            { time: "6:10 pm", name: "Govt" }, { time: "6:25 pm", name: "Govt" }, { time: "6:38 pm", name: "Govt" },
            { time: "6:45 pm", name: "Govt" }, { time: "7:05 pm", name: "Govt" }, { time: "7:28 pm", name: "Govt" },
            { time: "7:55 pm", name: "Govt" }, { time: "8:00 pm", name: "Private" }, { time: "8:11 pm", name: "Govt" },
            { time: "8:25 pm", name: "Govt" }, { time: "8:35 pm", name: "Govt" }, { time: "9:15 pm", name: "Govt" },
            { time: "9:25 pm", name: "Govt" }, { time: "10:50 pm", name: "Govt" }
        ]
    };

    const getRoutes = (pOrigin, pDest) => {
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

        // 1. ERODE (ERD) -> COIMBATORE (CBE)
        if (originCode === 'ERD' && destCode === 'CBE') {
            routeKey = 'ERD-CBE';
            baseDuration = '2h 10m';
            defaultStops = 'Direct';
        }
        // 2. COIMBATORE (CBE) -> ERODE (ERD)
        else if (originCode === 'CBE' && destCode === 'ERD') {
            routeKey = 'CBE-ERD';
            baseDuration = '2h 10m';
            defaultStops = 'Direct';
        }
        // 3. ERODE (ERD) -> METTUR (MTR)
        else if (originCode === 'ERD' && destCode === 'MTR') {
            routeKey = 'ERD-MTR';
            baseDuration = '1h 30m';
            defaultStops = 'Multiple';
        }
        // 4. METTUR (MTR) -> ERODE (ERD)
        else if (originCode === 'MTR' && destCode === 'ERD') {
            routeKey = 'MTR-ERD';
            baseDuration = '1h 30m';
            defaultStops = 'Multiple';
        }

        if (!routeKey) return { routes: [], message: "No routes available for this journey" };

        const rawList = SCHEDULES[routeKey];
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

        return futureList.map((item, idx) => {
            // "Name / Type" logic
            let finalName = item.name;
            let finalType = 'bus';
            let isGovt = false;

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
                tag: tag,
                tagColor: tagColor,
                tagTextColor: tagTextColor,
                isDeparted: isDeparted,     // For disabling click
                isBlinking: isBlinking,     // For UI animation
                routeNumber: finalName,
                duration: baseDuration,
                stops: defaultStops,
                frequency: `${t('route_list.dep', 'Dep')}: ${item.time}`,
                subtext: isGovt ? t('route_list.state_transport', 'State Transport') : t('route_list.private_operator', 'Private Operator')
            };
        });
    };

    const options = getRoutes(origin, destination);

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
            {/* Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', textAlign: isRTL ? 'right' : 'left' }}>
                        {t('route_list.routes_available', 'Routes available')}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px', textAlign: isRTL ? 'right' : 'left' }}>
                        {routeStats?.distance || '16 km'} • ~{routeStats?.duration || '48 mins'}
                    </div>
                </div>
                {/* Origin/Dest small summary */}
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF' }}>
                    {origin?.name?.split(',')[0]} <ArrowRight size={10} style={{ margin: '0 2px' }} /> {destination?.name?.split(',')[0]}
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
                                    justifyContent: 'space-between'
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
                                            objectFit: 'contain',
                                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1))'
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
                                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '2px' }}>
                                        {option.routeNumber}
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
                                            {option.frequency.replace(t('route_list.every', 'Every') + ' ', '')}
                                        </span>
                                    </div>
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
                            background: '#111',
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
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
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
            ) : (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: '#F9FAFB',
                    borderRadius: '24px',
                    color: '#6B7280'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚌💨</div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
                        {t('route_list.no_routes_title', 'No routes available')}
                    </h3>
                    <p style={{ fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                        {t('route_list.no_routes_body', 'We currently only serve Erode ↔ Mettur and Erode ↔ Coimbatore.')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default RouteOptionsList;
