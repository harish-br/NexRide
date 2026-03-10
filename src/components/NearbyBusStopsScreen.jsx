import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Locate, AlertCircle } from 'lucide-react';
import haptics from '../utils/haptics';
import { getDistance } from '../utils/locationUtils';
import busStopsData from '../data/busStopsData';

const RADIUS_METERS = 2000;

const formatDistance = (meters) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
};

const FormatETA = ({ distance }) => {
    const minutes = Math.ceil(distance / 80);

    return (
        <span>
            <span style={{ fontWeight: 800 }}>{minutes}</span>
            <span style={{ fontSize: 14, marginLeft: 4 }}>min</span>
        </span>
    );
};

/* ───────────────── Stop Card ───────────────── */

const StopCard = ({ stop, isNearest, onViewMap }) => {
    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                haptics.light();
                onViewMap(stop);
            }}
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '22px 18px',
                borderBottom: '1px solid #F1F3F5'
            }}
        >

            <div style={{ display: 'flex', gap: 16, flex: 1 }}>

                <div
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <img src="/icons/bus_icon_minimal.jpg" style={{ width: 24 }} />
                </div>

                <div style={{ flex: 1 }}>

                    <div
                        style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#111827'
                        }}
                    >
                        {stop.name}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 10,
                            marginTop: 6,
                            alignItems: 'center'
                        }}
                    >

                        <span
                            style={{
                                fontSize: 15,
                                color: '#6B7280',
                                fontWeight: 500
                            }}
                        >
                            {formatDistance(stop.distance)}
                        </span>

                        <span
                            style={{
                                fontSize: 16,
                                fontWeight: 600,
                                color: '#2563EB'
                            }}
                        >
                            View on map
                        </span>

                        {isNearest && (
                            <span
                                style={{
                                    fontSize: 12,
                                    padding: '5px 10px',
                                    borderRadius: 999,
                                    background: '#ECFDF5',
                                    color: '#047857',
                                    fontWeight: 600
                                }}
                            >
                                Closest
                            </span>
                        )}

                    </div>

                </div>

            </div>

            <div style={{ textAlign: 'right' }}>

                <div
                    style={{
                        fontSize: 20,
                        fontWeight: 800
                    }}
                >
                    <FormatETA distance={stop.distance} />
                </div>

                <div
                    style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#16A34A'
                    }}
                >
                    Walk
                </div>

            </div>

        </motion.div>
    );
};

/* ───────────────── Main Screen ───────────────── */

const NearbyBusStopsScreen = ({ userPosition, onBack, onViewStopOnMap }) => {

    const nearbyStops = useMemo(() => {

        if (!userPosition) return [];

        return busStopsData
            .map(stop => ({
                ...stop,
                distance: getDistance(
                    userPosition.lat,
                    userPosition.lng,
                    stop.latitude,
                    stop.longitude
                )
            }))
            .filter(stop => stop.distance <= RADIUS_METERS)
            .sort((a, b) => a.distance - b.distance);

    }, [userPosition]);

    const handleViewMap = (stop) => {
        onViewStopOnMap(stop);
    };

    return (

        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: '#F6F7F9',
                display: 'flex',
                flexDirection: 'column'
            }}
        >

            {/* ───── Header (Matched to Find Buses UI) ───── */}
            <div
                style={{
                    height: '64px',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'white',
                    borderBottom: '1px solid #E5E7EB',
                    zIndex: 100,
                    paddingTop: 'env(safe-area-inset-top)',
                    flexShrink: 0
                }}
            >
                <button
                    onClick={() => {
                        haptics.light();
                        onBack();
                    }}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#F3F4F6',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        marginRight: '16px'
                    }}
                >
                    <ArrowLeft size={22} color="#1F2937" />
                </button>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: '18px',
                            fontWeight: 600,
                            color: '#111'
                        }}
                    >
                        Nearby Stops
                    </h1>
                    <p
                        style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#6B7280',
                            fontWeight: 500
                        }}
                    >
                        {userPosition
                            ? `Within 2 km • ${nearbyStops.length} stop${nearbyStops.length !== 1 ? 's' : ''}`
                            : 'Detecting your location'}
                    </p>
                </div>
            </div>

            {/* ───── Content ───── */}

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 16
                }}
            >

                {!userPosition && (

                    <div
                        style={{
                            marginTop: 120,
                            textAlign: 'center'
                        }}
                    >
                        <Locate size={36} color="#2563EB" />
                        <p style={{ fontWeight: 700 }}>Detecting your location</p>
                    </div>

                )}

                {userPosition && nearbyStops.length === 0 && (

                    <div
                        style={{
                            marginTop: 120,
                            textAlign: 'center'
                        }}
                    >
                        <AlertCircle size={36} color="#F59E0B" />
                        <p style={{ fontWeight: 700 }}>No nearby stops</p>
                    </div>

                )}

                {nearbyStops.length > 0 && (

                    <div
                        style={{
                            background: '#fff',
                            borderRadius: 16,
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                    >

                        {nearbyStops.map((stop, index) => (

                            <StopCard
                                key={stop.id}
                                stop={stop}
                                isNearest={index === 0}
                                onViewMap={handleViewMap}
                            />

                        ))}

                        <p
                            style={{
                                textAlign: 'center',
                                padding: '24px',
                                fontSize: 15,
                                color: '#9CA3AF'
                            }}
                        >
                            Tap a stop to view on map
                        </p>

                    </div>

                )}

            </div>

        </motion.div>

    );
};

export default NearbyBusStopsScreen;