import React, { useState, useEffect } from 'react';
import { motion, useTransform, AnimatePresence } from 'framer-motion';
import { BusFront, QrCode, Keypad } from 'lucide-react';
import haptics from '../utils/haptics';

const TicketAccessControl = ({ sheetY, onScanQR, onScanOTP, isServiceable = true, show = true }) => {
    const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
    const [isToggleOn, setIsToggleOn] = useState(false);
    const [activeMode, setActiveMode] = useState(null); // 'QR' or 'OTP'
    const [showSelector, setShowSelector] = useState(false);
    
    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fabBottom = useTransform(
        sheetY || { get: () => 0 },
        (y) => {
            const gap = 53;
            const calcBottom = (windowHeight - y) + gap;
            return Math.max(100, calcBottom);
        }
    );

    const handleToggleClick = () => {
        if (!isServiceable) {
            console.log("Current location is not serviceable");
            haptics.error();
            // TODO: show toast or overlay text
            return;
        }

        haptics.light();
        const nextState = !isToggleOn;
        setIsToggleOn(nextState);

        if (nextState) {
            const lastMode = localStorage.getItem('lastTicketMode');
            if (lastMode === 'QR' || lastMode === 'OTP') {
                setActiveMode(lastMode);
            } else {
                setActiveMode('QR'); 
                setShowSelector(true); 
            }
        } else {
            setShowSelector(false);
        }
    };

    const handleModeSelect = (mode) => {
        haptics.selection();
        setActiveMode(mode);
        localStorage.setItem('lastTicketMode', mode);
        setShowSelector(false);
    };

    const handleActionButtonClick = () => {
        haptics.selection();
        if (activeMode === 'QR') {
            onScanQR && onScanQR();
        } else if (activeMode === 'OTP') {
            onScanOTP && onScanOTP();
        }
    };

    if (!show) return null;

    return (
        <>
            {/* Action Button at the bottom center of the screen */}
            <AnimatePresence>
                {isToggleOn && activeMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px', // Just above bottom nav (with a little more clearance)
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 40,
                        }}
                    >
                        <button
                            onClick={handleActionButtonClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#1D4ED8', // Matches primary blue / nexride styles
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '14px 28px',
                                fontSize: '16px',
                                fontWeight: '700',
                                boxShadow: '0 8px 24px rgba(29, 78, 216, 0.4)',
                                cursor: 'pointer',
                            }}
                        >
                            {activeMode === 'QR' ? <QrCode size={20} /> : <Keypad size={20} />}
                            BUS {activeMode}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pill Toggle positioned on the left, tracking bottom sheet */}
            <motion.div
                style={{
                    position: 'fixed',
                    bottom: fabBottom,
                    left: '16px',
                    zIndex: 35, 
                }}
            >
                <div style={{ position: 'relative' }}>
                    {/* Mode Selector Popover */}
                    <AnimatePresence>
                        {showSelector && isToggleOn && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '100%',
                                    left: 0,
                                    marginBottom: '12px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    padding: '8px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    width: '130px',
                                }}
                            >
                                <button
                                    onClick={() => handleModeSelect('QR')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: activeMode === 'QR' ? '#F3F4F6' : 'white',
                                        color: '#111827', border: 'none', padding: '10px 12px',
                                        borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    <QrCode size={18} color="#3B82F6" />
                                    BUS QR
                                </button>
                                <button
                                    onClick={() => handleModeSelect('OTP')}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        background: activeMode === 'OTP' ? '#F3F4F6' : 'white',
                                        color: '#111827', border: 'none', padding: '10px 12px',
                                        borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    <Keypad size={18} color="#3B82F6" />
                                    BUS OTP
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Main Pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: isToggleOn ? '#374151' : '#4B5563',
                            borderRadius: '30px',
                            padding: '6px 6px 6px 14px',
                            gap: '12px',
                            boxShadow: isToggleOn ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                            transition: 'background 0.3s ease',
                        }}
                    >
                        {/* Left Side: Bus Icon */}
                        <div 
                            style={{ position: 'relative', cursor: isToggleOn ? 'pointer' : 'default' }}
                            onClick={() => {
                                if (isToggleOn) {
                                    haptics.light();
                                    setShowSelector(!showSelector);
                                }
                            }}
                        >
                            <BusFront size={20} color={isToggleOn ? '#FFFFFF' : '#D1D5DB'} />
                            {isToggleOn && (
                                <div style={{
                                    position: 'absolute', bottom: -2, right: -4,
                                    width: '10px', height: '10px', background: '#22C55E', // Green dot
                                    borderRadius: '50%', border: '2px solid #374151'
                                }} />
                            )}
                        </div>

                        {/* Right Side: Toggle Switch */}
                        <div
                            onClick={handleToggleClick}
                            style={{
                                width: '48px',
                                height: '28px',
                                background: isToggleOn ? '#F3F4F6' : '#9CA3AF',
                                borderRadius: '14px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.3s ease',
                            }}
                        >
                            <motion.div
                                initial={false}
                                animate={{ x: isToggleOn ? 22 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    background: isToggleOn ? 'white' : 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: '2px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default TicketAccessControl;
