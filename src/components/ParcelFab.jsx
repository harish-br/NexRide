import React from 'react';
import { motion, useTransform } from 'framer-motion';
import packageIcon from '../icons8-package-94.png';

const ParcelFab = ({ onClick, sheetY, show = true }) => {
    // Calculate dynamic top position via transform
    // Formula: FAB Top = Sheet Top Y - FAB Height - Margin
    // FAB Height = 48px, Margin = 16px
    const fabBottom = useTransform(
        sheetY || { get: () => window.innerHeight - 358 },
        (y) => `calc(100vh - ${y}px + 16px)`
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
                position: 'absolute',
                bottom: fabBottom, // Anchored exactly above the bottom sheet
                left: '16px',
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
