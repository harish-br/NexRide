import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Locate, AlertCircle } from 'lucide-react';
import haptics from '../utils/haptics';
import { getDistance } from '../utils/locationUtils';
import busStopsData from '../data/busStopsData';
import busIconImg from '../assets/bus_hero_final.png';

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
                background: 'white',
                borderRadius: '16px',
                padding: '20px 18px',
                marginBottom: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                position: 'relative',
                cursor: 'pointer'
            }}
        >
            {/* Left Section (Stop Info) */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                
                {/* Top row */}
                <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '6px'
                }}>
                    {stop.name}
                </div>

                {/* Second row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    <span style={{
                        fontSize: '14px',
                        color: '#6B7280'
                    }}>
                        {formatDistance(stop.distance)}
                    </span>
                    <span style={{
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#2563EB'
                    }}>
                        View on map
                    </span>
                    {isNearest && (
                        <span style={{
                            background: '#ECFDF5',
                            color: '#047857',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600
                        }}>
                            Closest
                        </span>
                    )}
                </div>

            </div>

            {/* Right Section (Walking ETA) */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end', 
                paddingRight: '56px',
                position: 'relative', 
                zIndex: 1 
            }}>
                
                {/* Walking ETA */}
                <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#111827'
                }}>
                    <FormatETA distance={stop.distance} />
                </div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#16A34A'
                }}>
                    Walk
                </div>

            </div>

            {/* Icon - Absolutely positioned to bottom right */}
            <div style={{
                position: 'absolute',
                right: '16px',
                bottom: '14px',
                width: '34px',
                height: 'auto',
                opacity: 0.95,
                zIndex: 0
            }}>
                <img
                    src={busIconImg}
                    alt="Bus"
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain'
                    }}
                />
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

                    <div style={{ paddingBottom: '24px' }}>

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
                                paddingTop: '20px',
                                fontSize: '15px',
                                color: '#9CA3AF',
                                margin: 0
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