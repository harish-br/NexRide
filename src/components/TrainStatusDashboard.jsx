import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, TrainFront, Clock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- TIME FORMATTER (Standardized) ---
const formatTime = (timeStr) => {
    if (!timeStr) return '--';
    return timeStr; // Assuming API returns formatted str like "12:30" or "12:30 PM". 
    // If raw ISO, add parsing logic here.
};

// --- FLOATING STATUS CARD ---
const FloatingStatusCard = ({ trainData, isVisible }) => {
    if (!trainData) return null;

    const isLate = trainData.isLate;
    const msg = isLate
        ? `Delayed by ${trainData.overallDelay} mins`
        : 'On Time';

    // Determine context (e.g. Departed X vs Arrived X)
    // We'll use the current station logic from props ideally, 
    // but for now we use the overall status text props if available, else standard.
    const statusHeader = trainData.currentStation
        ? `Departed ${trainData.currentStation}`
        : (trainData.status || "Live Status");

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                        position: 'absolute',
                        top: '-10px', // Shift up slightly relative to the train icon
                        left: '40px', // To the right of the timeline
                        background: 'white',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        border: '1px solid white', // clean look
                        zIndex: 50,
                        minWidth: '180px',
                        pointerEvents: 'none' // Let clicks pass through to parent to reset timer
                    }}
                >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '4px' }}>
                        {statusHeader}
                    </div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: isLate ? '#FEF2F2' : '#ECFDF5',
                        color: isLate ? '#DC2626' : '#059669',
                        padding: '4px 8px', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 600
                    }}>
                        {isLate ? <AlertCircle size={12} /> : <Clock size={12} />}
                        {msg}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '6px' }}>
                        Updated just now
                    </div>

                    {/* Pointer / Arrow */}
                    <div style={{
                        position: 'absolute', top: '20px', left: '-6px',
                        width: '12px', height: '12px', background: 'white',
                        transform: 'rotate(45deg)',
                        borderRadius: '2px'
                    }} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- TIMELINE ROW COMPONENT ---
const TimelineRow = ({ stop, isFirst, isLast, isCurrent, isPast, trainData, showStatusCard }) => {
    return (
        <div style={{ display: 'flex', position: 'relative', minHeight: '60px' }}>

            {/* 1. ARRIVAL TIME (Left Column) */}
            <div style={{
                width: '70px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px',
                fontSize: '13px', fontWeight: '600', color: isPast ? '#374151' : '#9CA3AF'
            }}>
                {!isFirst && (stop.actualArrival || stop.scheduledArrival || '--')}
            </div>

            {/* 2. TIMELINE (Center Column) - Fixed Width */}
            <div style={{ width: '40px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {/* Vertical Line */}
                {!isLast && (
                    <div style={{
                        position: 'absolute', top: '14px', bottom: '-20px', width: '2px',
                        background: isPast ? '#BFDBFE' : '#E5E7EB', // Blue if passed, Grey if future
                        zIndex: 0
                    }} />
                )}

                {/* NODE */}
                <div style={{ zIndex: 10, marginTop: '5px' }}>
                    {isCurrent ? (
                        // CURRENT STATION NODE: Pulse Animation
                        <div style={{ position: 'relative' }}>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{
                                    width: '16px', height: '16px', borderRadius: '50%',
                                    background: '#3B82F6', border: '3px solid white',
                                    boxShadow: '0 0 0 2px #3B82F6'
                                }}
                            />
                            {/* TRAIN ICON (Floating on top of or next to node) */}
                            {/* Note: If train is moving between stations, this logic needs 'distance' check. 
                                 For v1, we assume 'isCurrent' means 'reached/at/departed recent' */}
                            <div style={{
                                position: 'absolute', top: '-4px', left: '-4px', right: '-4px', bottom: '-4px',
                                borderRadius: '50%', border: '1px solid rgba(59,130,246,0.3)',
                                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                            }} />
                            <style>{`@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }`}</style>

                            {/* Render Floating Status Card HERE */}
                            <FloatingStatusCard trainData={trainData} isVisible={showStatusCard} />
                        </div>
                    ) : isPast ? (
                        // PAST NODE: Filled Blue
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: '#93C5FD', marginTop: '2px'
                        }} />
                    ) : (
                        // FUTURE NODE: Hollow Grey
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            border: '2px solid #D1D5DB', background: 'white', marginTop: '2px'
                        }} />
                    )}
                </div>
            </div>

            {/* 3. STATION INFO & DEPARTURE (Right Column) */}
            <div style={{ flex: 1, paddingLeft: '8px', paddingBottom: '32px', display: 'flex', justifyContent: 'space-between' }}>
                {/* Info */}
                <div>
                    <div style={{
                        fontSize: '15px', fontWeight: isCurrent ? '700' : '500',
                        color: isCurrent || isPast ? '#111' : '#6B7280',
                        lineHeight: '1.2', marginBottom: '4px'
                    }}>
                        {stop.stationName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        {stop.distance ? `${stop.distance} km` : ''}
                        {stop.platform && stop.platform !== 'TBD' && ` • PF ${stop.platform}`}
                    </div>
                </div>

                {/* DEPARTURE TIME (Far Right) */}
                <div style={{
                    textAlign: 'right', fontSize: '13px', fontWeight: '600',
                    color: isPast ? '#374151' : '#9CA3AF', minWidth: '60px'
                }}>
                    {!isLast && (stop.actualDeparture || stop.scheduledDeparture || '--')}
                </div>
            </div>
        </div>
    );
};

const TrainStatusDashboard = ({ data }) => {
    if (!data) return null;

    const todayStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' });

    // --- AUTO-HIDE STATE ---
    const [showCard, setShowCard] = useState(true);
    const timerRef = useRef(null);

    const resetTimer = () => {
        // Show card immediately
        setShowCard(true);

        // Clear any pending timer
        if (timerRef.current) clearTimeout(timerRef.current);

        // Start new 5s timer
        timerRef.current = setTimeout(() => {
            setShowCard(false);
        }, 5000);
    };

    // Initial Timer on Mount
    useEffect(() => {
        resetTimer();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []); // Only on mount

    return (
        <div
            onClick={resetTimer} // GLOBAL TAP LISTENER inside this container
            style={{
                background: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                marginTop: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB',
                position: 'relative',
                cursor: 'pointer' // Hint that it is interactive
            }}
        >
            {/* HEADER */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 40,
                background: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '6px 10px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Today</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>{todayStr}</span>
                </div>
                <div style={{ padding: '6px 10px', background: 'white', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrainFront size={14} color="#374151" />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Coach Position</span>
                </div>
            </div>

            {/* COLUMN LABELS (Small) */}
            <div style={{ display: 'flex', padding: '12px 16px 4px 16px', background: 'white' }}>
                <div style={{ width: '70px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#9CA3AF', paddingRight: '16px' }}>ARRIVAL</div>
                <div style={{ width: '40px' }}></div> {/* Spacer for timeline */}
                <div style={{ flex: 1, fontSize: '10px', fontWeight: 600, color: '#9CA3AF', paddingLeft: '8px' }}>STATION</div>
                <div style={{ width: '60px', textAlign: 'right', fontSize: '10px', fontWeight: 600, color: '#9CA3AF' }}>DEPART</div>
            </div>

            {/* TIMELINE LIST */}
            <div style={{ padding: '8px 16px 24px 16px', background: 'white' }}>
                {data.timeline && data.timeline.length > 0 ? (
                    data.timeline.map((stop, i) => (
                        <TimelineRow
                            key={i}
                            stop={stop}
                            isFirst={i === 0}
                            isLast={i === data.timeline.length - 1}
                            isCurrent={stop.isCurrent} // Should be set by parent parser
                            isPast={stop.hasPassed}  // Should be set by parent parser
                            trainData={data}
                            showStatusCard={showCard}
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                        Loading route info...
                    </div>
                )}
            </div>

            {/* FLOATING REFRESH BUTTON (Bottom Right - like Google Maps) */}
            <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: 'white', borderRadius: '50%', width: '48px', height: '48px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 60
            }}>
                <RefreshCw size={20} color="#3B82F6" />
            </div>
        </div>
    );
};

export default TrainStatusDashboard;
