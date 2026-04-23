import React, { useEffect, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import packageIcon from '../icons8-package-94.png';

const ParcelFab = ({ onClick, sheetY, show = true }) => {
    // Window height state to handle resizing
    const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate dynamic bottom position via transform
    // Formula: FAB Bottom = (Window Height - Sheet Top Y) + Gap
    // Gap = 53px (Matches LocationFab)
    const fabBottom = useTransform(
        sheetY || { get: () => 0 },
        (y) => {
            const gap = 53;
            const calcBottom = (windowHeight - y) + gap;
            // Clamp to minimum safe area
            return Math.max(100, calcBottom);
        }
    );

    if (!show) return null;

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0, x: -20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: -20 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: fabBottom, // Dynamically driven by sheetY, same as LocationFab
                left: '20px',
                width: '100px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                zIndex: 35, // Same as LocationFab
                cursor: 'pointer',
                outline: 'none',
                padding: '0 12px'
            }}
        >
            <img src={packageIcon} alt="Parcel" style={{ width: '24px', height: '24px' }} />
            <span style={{
                color: '#111',
                fontSize: '14px',
                fontWeight: '600'
            }}>
                Parcel
            </span>
        </motion.button>
    );
};

export default ParcelFab;
