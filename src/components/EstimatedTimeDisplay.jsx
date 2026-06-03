import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const EstimatedTimeDisplay = ({ time, isLive = false, style, className }) => {
    const [showGuide, setShowGuide] = useState(false);

    // If time is missing or not a string, fallback to rendering the time as-is.
    if (!time) return <span style={style} className={className}>{time}</span>;

    // Prevent modal if live tracking is available (since accuracy guide applies to estimates)
    const handleTap = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!isLive) {
            setShowGuide(true);
        }
    };

    return (
        <>
            <span 
                onClick={handleTap}
                style={{ cursor: isLive ? 'inherit' : 'pointer', ...style }}
                className={className}
            >
                {!isLive && '~'}{time}
            </span>

            {createPortal(
                <AnimatePresence>
                    {showGuide && (
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            zIndex: 999999, // Ensure it's above everything
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            pointerEvents: 'none'
                        }}>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => { e.stopPropagation(); setShowGuide(false); }}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(4px)',
                                    WebkitBackdropFilter: 'blur(4px)',
                                    pointerEvents: 'auto'
                                }}
                            />

                            {/* Bottom Sheet */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: 'white',
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px',
                                    padding: '24px',
                                    paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
                                    position: 'relative',
                                    zIndex: 1,
                                    pointerEvents: 'auto',
                                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
                                    maxHeight: '90vh',
                                    overflowY: 'auto'
                                }}
                            >
                                <div style={{ width: '40px', height: '4px', background: '#E5E7EB', borderRadius: '4px', margin: '0 auto 20px' }} />
                                
                                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '16px', letterSpacing: '-0.02em' }}>
                                    Arrival Time Accuracy Guide
                                </h2>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#4B5563', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    <p style={{ margin: 0 }}>
                                        NexRide currently <strong>does not provide live bus tracking</strong>.
                                    </p>

                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111', marginBottom: '8px' }}>Arrival times are estimated using:</div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <li>Scheduled departure times</li>
                                            <li>Route distance</li>
                                            <li>Historical route patterns</li>
                                            <li>Previously approved timing records</li>
                                            <li>Common travel duration on the route</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <div style={{ fontWeight: '600', color: '#111', marginBottom: '8px' }}>Because there is no live GPS tracking, actual arrival times may vary due to:</div>
                                        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <li>Traffic</li>
                                            <li>Road conditions</li>
                                            <li>Weather</li>
                                            <li>Driver delays</li>
                                            <li>Route diversions</li>
                                        </ul>
                                    </div>
                                </div>

                                <div style={{ 
                                    marginTop: '24px', 
                                    padding: '16px', 
                                    background: '#F9FAFB', 
                                    borderRadius: '12px', 
                                    border: '1px solid #F3F4F6',
                                    fontSize: '0.85rem',
                                    color: '#6B7280',
                                    lineHeight: '1.5'
                                }}>
                                    <strong>Note:</strong> Arrival times shown in NexRide are estimates and should be used as guidance only. NexRide currently does not track buses in real time.
                                </div>

                                <button 
                                    onClick={(e) => { e.stopPropagation(); setShowGuide(false); }}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        background: '#2563EB',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        marginTop: '24px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Got it
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default EstimatedTimeDisplay;
