import React from 'react';
import { motion } from 'framer-motion';
import { X, Home, Construction } from 'lucide-react';
import haptics from '../utils/haptics';

const PaymentUnderConstructionScreen = ({ isVisible, onClose, onGoHome }) => {
    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    padding: '32px',
                    maxWidth: '400px',
                    width: '100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    position: 'relative',
                    textAlign: 'center'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={() => {
                        haptics.light();
                        onClose();
                    }}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: '#F3F4F6',
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
                    <X size={18} color="#6B7280" />
                </button>

                {/* Construction Icon */}
                <div style={{
                    width: '120px',
                    height: '120px',
                    margin: '0 auto 24px',
                    background: '#FEF3C7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Construction size={60} color="#F59E0B" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#111827',
                    marginBottom: '12px'
                }}>
                    Payments Coming Soon
                </h2>

                {/* Description */}
                <p style={{
                    fontSize: '15px',
                    lineHeight: '1.6',
                    color: '#6B7280',
                    marginBottom: '32px'
                }}>
                    We're working hard to bring you a seamless payment experience.
                    In the meantime, you can explore routes and plan your journey!
                </p>

                {/* Go Home Button */}
                <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                        haptics.medium();
                        onGoHome();
                    }}
                    style={{
                        width: '100%',
                        backgroundColor: '#111827',
                        color: 'white',
                        border: 'none',
                        padding: '16px',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    <Home size={20} />
                    Go Home
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

export default PaymentUnderConstructionScreen;
