import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Delete, ArrowRight, ScanLine, BellRing } from 'lucide-react';
import haptics from '../utils/haptics';

const ActiveRideScanner = ({ isOpen, onClose, onScanSuccess }) => {
    const [busNumber, setBusNumber] = useState('');
    const videoRef = useRef(null);
    const [hasCamera, setHasCamera] = useState(false);
    const [stream, setStream] = useState(null);

    useEffect(() => {
        if (isOpen) {
            startCamera();
            setBusNumber('');
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setHasCamera(true);
        } catch (err) {
            console.error("Camera access denied or NOT supported:", err);
            setHasCamera(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleKeyPress = (num) => {
        if (busNumber.length < 4) {
            haptics.light();
            setBusNumber(prev => prev + num);
        }
    };

    const handleDelete = () => {
        haptics.light();
        setBusNumber(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (busNumber.length === 4) {
            haptics.impact();
            onScanSuccess({ type: 'manual', value: busNumber });
        }
    };

    // Auto-submit when 4 digits are entered? 
    // The user said "Disable submission until all 4 digits are entered", which implies a submit button.
    // But then "If the user enters a valid 4-digit bus number, fetch the bus details on submit".
    // I'll add a prominent submit button that only enables at 4 digits.

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 5000,
                backgroundColor: 'white',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* --- TOP SECTION (CAMERA) --- */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
                {hasCamera ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                            width: '100%', height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'white', gap: '16px',
                        background: 'linear-gradient(45deg, #111, #222)'
                    }}>
                        <Camera size={48} opacity={0.5} />
                        <span style={{ fontSize: '14px', opacity: 0.7 }}>Camera Preview Not Available</span>
                    </div>
                )}

                {/* Scanning Frame Overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        width: '240px', height: '240px',
                        border: '2px solid rgba(255,255,255,0.8)',
                        borderRadius: '24px',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
                        position: 'relative'
                    }}>
                        {/* Corner markers */}
                        {[0, 90, 180, 270].map(rotate => (
                            <div key={rotate} style={{
                                position: 'absolute', top: -2, left: -2,
                                width: '30px', height: '30px',
                                borderTop: '4px solid #FACC15',
                                borderLeft: '4px solid #FACC15',
                                borderTopLeftRadius: '12px',
                                transform: `rotate(${rotate}deg)`,
                                transformOrigin: 'top left',
                                marginLeft: rotate === 90 || rotate === 180 ? '100%' : 0,
                                marginTop: rotate === 180 || rotate === 270 ? '100%' : 0,
                            }} />
                        ))}

                        {/* Animated Scanning Line */}
                        <motion.div
                            animate={{ top: ['10%', '90%'] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            style={{
                                position: 'absolute', left: '10%', right: '10%',
                                height: '2px', background: '#FACC15',
                                boxShadow: '0 0 8px #FACC15',
                                zIndex: 2
                            }}
                        />
                    </div>
                    <div style={{
                        position: 'absolute', bottom: '40px',
                        color: 'white', fontSize: '14px', fontWeight: 600,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <ScanLine size={18} />
                        Align Bus QR Code to Scan
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '50px', right: '20px',
                        width: '40px', height: '40px', borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)', color: 'white',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', backdropFilter: 'blur(8px)', zIndex: 10
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* --- BOTTOM SECTION (MANUAL ENTRY) --- */}
            <div style={{
                flex: 1, backgroundColor: 'white', padding: '24px',
                display: 'flex', flexDirection: 'column',
                borderTop: '1px solid #E5E7EB',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
                zIndex: 5
            }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>
                        Enter Bus Number
                    </h3>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Type the 4-digit number found on the bus
                    </p>
                </div>

                {/* Input Display */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px'
                }}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '56px', height: '64px',
                            borderRadius: '16px',
                            backgroundColor: '#F3F4F6',
                            border: busNumber.length === i ? '2px solid #111' : '1px solid #E5E7EB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '28px', fontWeight: 700, color: '#111',
                            transition: 'all 0.2s'
                        }}>
                            {busNumber[i] || ''}
                            {busNumber.length === i && (
                                <motion.div
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    style={{ width: '2px', height: '30px', backgroundColor: '#111', position: 'absolute' }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Keypad */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                    maxWidth: '320px', margin: '0 auto', width: '100%'
                }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            style={{
                                height: '54px', borderRadius: '16px', border: 'none',
                                backgroundColor: '#F9FAFB',
                                fontSize: '20px', fontWeight: 600, color: '#111',
                                cursor: 'pointer'
                            }}
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleDelete}
                        style={{
                            height: '54px', borderRadius: '16px', border: 'none',
                            backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <Delete size={24} color="#666" />
                    </button>
                    <button
                        onClick={() => handleKeyPress('0')}
                        style={{
                            height: '54px', borderRadius: '16px', border: 'none',
                            backgroundColor: '#F9FAFB',
                            fontSize: '20px', fontWeight: 600, color: '#111',
                            cursor: 'pointer'
                        }}
                    >
                        0
                    </button>
                    <button
                        disabled={busNumber.length < 4}
                        onClick={handleSubmit}
                        style={{
                            height: '54px', borderRadius: '16px', border: 'none',
                            backgroundColor: busNumber.length === 4 ? '#111' : '#E5E7EB',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: busNumber.length === 4 ? 'pointer' : 'default',
                            transition: 'all 0.3s'
                        }}
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ActiveRideScanner;
