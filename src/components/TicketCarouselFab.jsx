import React, { useState, useEffect } from 'react';
import { motion, useTransform, AnimatePresence } from 'framer-motion';
import { QrCode, Key } from 'lucide-react';
import haptics from '../utils/haptics';

const TicketCarouselFab = ({ sheetY, onScanQR, onScanOTP, show = true }) => {
    const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);
    const [activeMode, setActiveMode] = useState('QR'); // 'QR' or 'OTP'
    
    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-swap logic
    useEffect(() => {
        if (!show) return;
        const interval = setInterval(() => {
            setActiveMode(prev => prev === 'QR' ? 'OTP' : 'QR');
        }, 2500); // 2.5 seconds loop
        return () => clearInterval(interval);
    }, [show]);

    const fabBottom = useTransform(
        sheetY || { get: () => 0 },
        (y) => {
            const gap = 53; // Same gap as LocationFab
            const calcBottom = (windowHeight - y) + gap;
            return Math.max(100, calcBottom);
        }
    );

    const handleTap = () => {
        haptics.selection();
        if (activeMode === 'QR') {
            onScanQR && onScanQR();
        } else {
            onScanOTP && onScanOTP();
        }
    };

    if (!show) return null;

    return (
        <motion.button
            onClick={handleTap}
            style={{
                position: 'fixed',
                bottom: fabBottom,
                left: '16px',
                zIndex: 35, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#2563EB', // Solid blue
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '0 12px',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                cursor: 'pointer',
                overflow: 'hidden',
                width: '80px', // Slightly increased width for icon + text
                height: '48px',
            }}
        >
            <QrCode size={20} color="#FFFFFF" />
            <div style={{ position: 'relative', width: '28px', height: '20px', display: 'flex', alignItems: 'center' }}>
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={activeMode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            width: '100%',
                            textAlign: 'left',
                            fontSize: '14px',
                            fontWeight: '700',
                            lineHeight: '1'
                        }}
                    >
                        {activeMode === 'QR' ? 'QR' : 'OTP'}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.button>
    );
};

export default TicketCarouselFab;
