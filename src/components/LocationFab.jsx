import React, { useEffect, useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { motion, useTransform } from 'framer-motion';

const LocationFab = ({ onLocate, isLocating, sheetY, show = true }) => {
    // Window height state to handle resizing
    const [windowHeight, setWindowHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 800);

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Calculate dynamic bottom position via transform
    // Formula: FAB Bottom = (Window Height - Sheet Top Y) + Gap
    // Gap = 20px
    // Safe margin: Ensure it doesn't go below e.g., 90px (Bottom Nav height + margin)

    // Default fallback if sheetY is missing (should not happen based on App.jsx) defaults to hidden offscreen or safe spot
    const fabBottom = useTransform(
        sheetY || { get: () => 0 },
        (y) => {
            const gap = 53;
            const calcBottom = (windowHeight - y) + gap;
            // Clamp to minimum safe area (e.g., just above bottom nav if sheet is somehow extremely low)
            // But visually, it generally rides the sheet.
            // If sheet is expanded (y ~ 50), bottom is large.
            // If sheet is collapsed (y ~ H-300), bottom is ~324.
            // If sheet is hidden/low, we might want a min bottom.
            return Math.max(100, calcBottom);
        }
    );

    if (!show) return null;

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={onLocate}
            disabled={isLocating}
            style={{
                position: 'fixed',
                bottom: fabBottom, // Dynamically driven by sheetY
                right: '20px',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'white',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 35, // Below BottomSheet (50) but above Map
                cursor: 'pointer',
                outline: 'none'
            }}
        >
            {isLocating ? (
                <Loader2 size={22} className="animate-spin" color="#3B82F6" />
            ) : (
                <LocateFixed size={22} color="#3B82F6" />
            )}

            {/* Pulsing Ring for Loading State */}
            {isLocating && (
                <span style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: '50%',
                    border: '2px solid #3B82F6',
                    opacity: 0.3,
                    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }} />
            )}
            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(1.5); opacity: 0; }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </motion.button>
    );
};

export default LocationFab;
