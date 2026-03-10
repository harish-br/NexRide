import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation2, Clock, Bus, Locate, AlertCircle, Footprints, Star, ChevronRight } from 'lucide-react';
import haptics from '../utils/haptics';
import { getDistance } from '../utils/locationUtils';
import busStopsData from '../data/busStopsData';

const RADIUS_METERS = 2000;

const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const estimateWalkTime = (meters) => {
    const minutes = Math.ceil(meters / 80);
    if (minutes < 1) return '< 1 min';
    if (minutes >= 60) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
    }
    return `${minutes} min`;
};

// ─── Distance Progress Bar ───────────────────────────────────
const DistanceBar = ({ distance, maxDistance = RADIUS_METERS }) => {
    const pct = Math.min((distance / maxDistance) * 100, 100);
    const color = pct < 25 ? '#34C759' : pct < 60 ? '#FF9F0A' : '#FF3B30';
    return (
        <div style={{
            width: '100%', height: '4px',
            background: '#F0F0F0',
            borderRadius: '2px',
            overflow: 'hidden',
        }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                    height: '100%',
                    borderRadius: '2px',
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                }}
            />
        </div>
    );
};

// 🕒 Format ETA Helper (JSX with Visual Priority)
const FormatETA = ({ distance }) => {
    const totalMinutes = Math.ceil(distance / 80);
    if (totalMinutes < 1) {
        return (
            <span>
                <span style={{ fontWeight: 800 }}>&lt; 1</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>min</span>
            </span>
        );
    }
    if (totalMinutes < 60) {
        return (
            <span>
                <span style={{ fontWeight: 800 }}>{totalMinutes}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>min</span>
            </span>
        );
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
        return (
            <span>
                <span style={{ fontWeight: 800 }}>{hours}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>hr</span>
            </span>
        );
    }

    return (
        <span>
            <span style={{ fontWeight: 800 }}>{hours}</span> <span style={{ fontSize: '0.85em', fontWeight: 600 }}>hr</span>
            <span style={{ display: 'inline-block', width: '4px' }}></span>
            <span style={{ opacity: 0.9, fontWeight: 600 }}>
                <span style={{ fontWeight: 800 }}>{minutes}</span> <span style={{ fontSize: '0.85em', fontWeight: 500 }}>min</span>
            </span>
        </span>
    );
};

// ─── Modern Stop Card ──────────────────────────────────────────────
const StopCard = ({ stop, index, isNearest, onViewMap }) => {
    return (
        <div
            onClick={() => {
                haptics.light();
                onViewMap(stop);
            }}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 4px',
                borderBottom: '1px solid #F3F4F6',
                cursor: 'pointer'
            }}
        >
            {/* Left: Icon + Bus Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: '#F3F4F6', overflow: 'hidden', flexShrink: 0
                }}>
                    <img
                        src="/icons/bus_icon_minimal.jpg"
                        alt="Bus"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#6B7280;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg></div>`;
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stop.name} <span style={{ fontSize: '13px', fontWeight: 700, color: '#6B7280' }}>| {formatDistance(stop.distance)}</span>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                            View on Map
                        </span>

                        <div className="badge-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {isNearest && (
                                <span style={{
                                    fontSize: '12px', fontWeight: '500', color: '#065F46',
                                    background: '#ECFDF5', border: '1px solid #A7F3D0',
                                    borderRadius: '9999px', padding: '4px 8px', whiteSpace: 'nowrap'
                                }}>
                                    Closest
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: ETA & Status */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '70px', flexShrink: 0, paddingLeft: '8px' }}>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                    <FormatETA distance={stop.distance} />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>
                    Walk
                </div>
            </div>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────
const NearbyBusStopsScreen = ({ userPosition, onBack, onViewStopOnMap }) => {
    const nearbyStops = useMemo(() => {
        if (!userPosition) return [];

        return busStopsData
            .map(stop => ({
                ...stop,
                distance: getDistance(
                    userPosition.lat, userPosition.lng,
                    stop.latitude, stop.longitude
                ),
            }))
            .filter(stop => stop.distance <= RADIUS_METERS)
            .sort((a, b) => a.distance - b.distance);
    }, [userPosition]);

    const handleViewMap = (stop) => {
        if (onViewStopOnMap) onViewStopOnMap(stop);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#F6F7F9',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* ── Header ── */}
            <div style={{
                height: '110px',
                paddingTop: '48px',
                paddingLeft: '24px',
                paddingRight: '24px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                boxSizing: 'border-box',
                zIndex: 10,
                boxShadow: '0 1px 0 #E5E5E5',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            haptics.light();
                            onBack();
                        }}
                        style={{
                            background: '#F1F3F4',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <ArrowLeft size={24} color="#111" />
                    </motion.button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 700,
                            color: '#111',
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em',
                        }}>
                            Nearby Stops
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: '15px',
                            color: '#8E8E93',
                            fontWeight: 500,
                        }}>
                            {userPosition
                                ? `Within 2 km • ${nearbyStops.length} stop${nearbyStops.length !== 1 ? 's' : ''} found`
                                : 'Waiting for location…'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '12px 16px 100px',
            }}>
                {/* No location state */}
                {!userPosition && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '55vh',
                        gap: '16px',
                        textAlign: 'center',
                        padding: '0 24px',
                    }}>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #E8F0FE, #D2E3FC)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(26, 115, 232, 0.15)',
                            }}
                        >
                            <Locate size={30} color="#1A73E8" />
                        </motion.div>
                        <p style={{ fontSize: '17px', fontWeight: 700, color: '#202124', margin: 0 }}>
                            Detecting your location…
                        </p>
                        <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                            Please allow location access to find nearby bus stops
                        </p>
                    </div>
                )}

                {/* Has location but no stops */}
                {userPosition && nearbyStops.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '55vh',
                        gap: '16px',
                        textAlign: 'center',
                        padding: '0 24px',
                    }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: '#FEF3C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <AlertCircle size={30} color="#D97706" />
                        </div>
                        <p style={{ fontSize: '17px', fontWeight: 700, color: '#202124', margin: 0 }}>
                            No bus stops nearby
                        </p>
                        <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0, lineHeight: 1.5 }}>
                            We couldn't find any bus stops within 2 km of your current location. Try moving to a different area.
                        </p>
                    </div>
                )}

                {/* Stop cards */}
                {nearbyStops.length > 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        marginTop: '12px',
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '0 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        {nearbyStops.map((stop, index) => (
                            <StopCard
                                key={stop.id}
                                stop={stop}
                                index={index}
                                isNearest={index === 0}
                                onViewMap={handleViewMap}
                            />
                        ))}

                        {/* Footer hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                textAlign: 'center',
                                fontSize: '13px',
                                color: '#9CA3AF',
                                margin: '16px 0',
                                fontWeight: 500,
                            }}
                        >
                            Tap a stop to view on map
                        </motion.p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default NearbyBusStopsScreen;
