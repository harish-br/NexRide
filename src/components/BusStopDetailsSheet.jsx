import React from 'react';
import { MapPin, Navigation, Clock, Ban } from 'lucide-react';

const BusStopDetailsSheet = ({ stop, onClose }) => {
    if (!stop) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#fff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                padding: '24px',
                paddingBottom: '40px', // Extra padding for safe area
                zIndex: 2000, // Above map, below potential overlays
            }}
        >
            {/* Drag Handle */}
            <div style={{
                width: '40px',
                height: '4px',
                background: '#E0E0E0',
                borderRadius: '2px',
                margin: '0 auto 20px'
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#202124',
                        margin: '0 0 4px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        {stop.name}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#5F6368', margin: 0 }}>
                        {stop.vicinity || 'Bus Stop'}
                    </p>
                </div>

                {/* Close Button (Optional, can just drag down) */}
                <button
                    onClick={onClose}
                    style={{
                        background: '#f1f3f4',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Ban size={16} color="#5F6368" style={{ transform: 'rotate(45deg)' }} />
                </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', background: '#E8F0FE', borderRadius: '8px' }}>
                        <MapPin size={18} color="#1A73E8" />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '12px', color: '#5F6368', fontWeight: '500' }}>Distance</span>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#202124' }}>
                            {stop.distance ? `${Math.round(stop.distance)}m` : 'Nearby'}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ padding: '8px', background: '#E6F4EA', borderRadius: '8px' }}>
                        <Clock size={18} color="#137333" />
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '12px', color: '#5F6368', fontWeight: '500' }}>Walk</span>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#202124' }}>
                            {stop.distance ? `~${Math.ceil(stop.distance / 80)} min` : '1 min'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <button
                onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.name)}&destination_place_id=${stop.place_id}&travelmode=walking`;
                    window.open(url, '_blank');
                }}
                style={{
                    width: '100%',
                    background: '#1A73E8',
                    color: '#fff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '16px',
                    fontSize: '16px', // Large touch target
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
                }}
            >
                <Navigation size={20} fill="white" />
                Navigate to Stop
            </button>
        </div>
    );
};

export default BusStopDetailsSheet;
