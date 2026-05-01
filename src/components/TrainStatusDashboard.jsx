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
        ? `Delayed by ${trainData.overallDelay} min`
        : 'On Time';

    const statusHeader = trainData.currentStation
        ? `Departed ${trainData.currentStation}`
        : (trainData.statusSummary || "Live Status");

    // Status Chip Style (Stricter mapping to User Request)
    const badgeBg = isLate ? '#FEF3C7' : '#ECFDF5';
    const badgeText = isLate ? '#D97706' : '#16A34A';

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
                        top: '-10px',
                        left: '40px',
                        background: 'white',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                        border: '1px solid #F1F5F9',
                        zIndex: 50,
                        minWidth: '200px',
                        pointerEvents: 'none'
                    }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                        {statusHeader}
                    </div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: badgeBg,
                        color: badgeText,
                        padding: '6px 12px', borderRadius: '10px',
                        fontSize: '12px', fontWeight: 700
                    }}>
                        {isLate ? <AlertCircle size={14} /> : <Clock size={14} />}
                        {msg}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '8px', fontWeight: 500 }}>
                        Updated just now
                    </div>

                    {/* Pointer / Arrow */}
                    <div style={{
                        position: 'absolute', top: '22px', left: '-6px',
                        width: '12px', height: '12px', background: 'white',
                        transform: 'rotate(45deg)',
                        borderLeft: '1px solid #F1F5F9',
                        borderBottom: '1px solid #F1F5F9',
                        zIndex: -1
                    }} />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- TIMELINE ROW COMPONENT ---
const TimelineRow = ({ stop, isFirst, isLast, isCurrent, isPast, trainData, showStatusCard }) => {
    // Arrival Logic
    const arrivalTime = !isFirst ? (stop.actualArrival || stop.scheduledArrival) : null;
    const isArrivalDelayed = stop.actualArrival && stop.actualArrival !== stop.scheduledArrival;

    // Departure Logic
    const departureTime = !isLast ? (stop.actualDeparture || stop.scheduledDeparture) : null;
    const isDepartureDelayed = stop.actualDeparture && stop.actualDeparture !== stop.scheduledDeparture;

    return (
        <div style={{ display: 'flex', position: 'relative', minHeight: '70px' }}>

            {/* 1. ARRIVAL TIME (Left Column) */}
            <div style={{
                width: '80px', textAlign: 'right', paddingRight: '16px', paddingTop: '4px',
                display: 'flex', flexDirection: 'column', gap: '2px'
            }}>
                <div style={{
                    fontSize: '13px', fontWeight: '800',
                    color: isArrivalDelayed ? '#D97706' : (isPast ? '#1E293B' : '#94A3B8')
                }}>
                    {arrivalTime || (isFirst ? '' : '—')}
                </div>
                {isArrivalDelayed && (
                    <div style={{ fontSize: '10px', color: '#CBD5E1', textDecoration: 'line-through' }}>
                        {stop.scheduledArrival}
                    </div>
                )}
            </div>

            {/* 2. TIMELINE (Center Column) */}
            <div style={{ width: '40px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {!isLast && (
                    <div style={{
                        position: 'absolute', top: '14px', bottom: '-20px', width: '2px',
                        background: isPast ? '#DBEAFE' : '#F1F5F9',
                        zIndex: 0
                    }} />
                )}

                <div style={{ zIndex: 10, marginTop: '5px' }}>
                    {isCurrent ? (
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
                            <div style={{
                                position: 'absolute', top: '-4px', left: '-4px', right: '-4px', bottom: '-4px',
                                borderRadius: '50%', border: '1px solid rgba(59,130,246,0.3)',
                                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                            }} />
                            <FloatingStatusCard trainData={trainData} isVisible={showStatusCard} />
                        </div>
                    ) : isPast ? (
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            background: '#93C5FD', marginTop: '2px'
                        }} />
                    ) : (
                        <div style={{
                            width: '12px', height: '12px', borderRadius: '50%',
                            border: '2px solid #E2E8F0', background: 'white', marginTop: '2px'
                        }} />
                    )}
                </div>
            </div>

            {/* 3. STATION INFO & DEPARTURE */}
            <div style={{ flex: 1, paddingLeft: '8px', paddingBottom: '32px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <div style={{
                        fontSize: '15px', fontWeight: isCurrent ? '800' : '600',
                        color: isCurrent || isPast ? '#1E293B' : '#64748B',
                        lineHeight: '1.2', marginBottom: '4px'
                    }}>
                        {stop.stationName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                        {stop.distance ? `${stop.distance} km` : ''}
                        {stop.platform && stop.platform !== 'TBD' && stop.platform !== '--' && ` • PF ${stop.platform}`}
                    </div>
                </div>

                {/* DEPARTURE TIME (Far Right) */}
                <div style={{
                    width: '80px', textAlign: 'right', paddingLeft: '16px', paddingTop: '4px',
                    display: 'flex', flexDirection: 'column', gap: '2px'
                }}>
                    <div style={{
                        fontSize: '13px', fontWeight: '800',
                        color: isDepartureDelayed ? '#D97706' : (isPast ? '#1E293B' : '#94A3B8')
                    }}>
                        {departureTime || (isLast ? '' : '—')}
                    </div>
                    {isDepartureDelayed && (
                        <div style={{ fontSize: '10px', color: '#CBD5E1', textDecoration: 'line-through' }}>
                            {stop.scheduledDeparture}
                        </div>
                    )}
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
