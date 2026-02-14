import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GlobalLoader = () => {
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowText(true);
        }, 5000); // 5 seconds strict delay

        return () => clearTimeout(timer);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#FFFFFF', // Pure white
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, // Highest priority
            pointerEvents: 'auto', // Block interaction
        }}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                style={{
                    width: '32px',
                    height: '32px',
                    border: '3px solid #E5E7EB',
                    borderTopColor: '#1569fd', // Primary Blue
                    borderRadius: '50%'
                }}
            />
            {showText && (
                <p style={{
                    marginTop: '24px',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: '#6B7280', // Neutral grey
                    animation: 'fadeIn 0.5s ease-in',
                    opacity: 1 // Explicit opacity start
                }}>
                    Still loading...
                </p>
            )}
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default GlobalLoader;
