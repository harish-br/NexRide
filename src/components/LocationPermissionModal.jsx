import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const BRAND_COLOR = '#1569FD';

export const LocationPermissionCard = ({ isOpen, onClose, onAllow, onManual, isLoading }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)'
            }}>
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: '420px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '28px 28px 0 0',
                        padding: '28px 24px 48px 24px',
                        boxShadow: '0 -8px 32px rgba(0,0,0,0.10)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0'
                    }}
                >
                    {/* Drag Indicator */}
                    <div style={{
                        width: '40px', height: '4px', backgroundColor: '#E5E7EB',
                        borderRadius: '2px', alignSelf: 'center', marginBottom: '36px'
                    }} />

                    {/* Title */}
                    <h2 style={{
                        fontSize: '22px', fontWeight: '700', color: '#111827',
                        margin: '0 0 10px 0', letterSpacing: '-0.02em', lineHeight: '1.25'
                    }}>
                        {t('location_permission.title', { defaultValue: 'Start moving with NexRide' })}
                    </h2>

                    {/* Description */}
                    <p style={{
                        fontSize: '15px', color: '#6B7280', lineHeight: '1.6',
                        margin: '0 0 40px 0', fontWeight: '400'
                    }}>
                        {t('location_permission.body', { defaultValue: 'We use your location to show nearby routes and improve accuracy.' })}
                    </p>

                    {/* Primary CTA */}
                    <motion.button
                        whileHover={isLoading ? {} : { scale: 1.02 }}
                        whileTap={isLoading ? {} : { scale: 0.97 }}
                        onClick={onAllow}
                        disabled={isLoading}
                        style={{
                            width: '100%', height: '54px',
                            background: isLoading ? '#F3F4F6' : BRAND_COLOR,
                            color: isLoading ? '#9CA3AF' : '#FFFFFF',
                            border: 'none', borderRadius: '16px',
                            fontSize: '16px', fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            boxShadow: isLoading ? 'none' : '0 4px 14px rgba(21,105,253,0.22)',
                            transition: 'all 0.2s ease',
                            marginBottom: '12px',
                            letterSpacing: '0.01em'
                        }}
                    >
                        {isLoading
                            ? t('location_permission.fetching', { defaultValue: 'Locating...' })
                            : t('location_permission.allow', { defaultValue: 'Use Current Location' })}
                    </motion.button>

                    {/* Secondary text action */}
                    <button
                        onClick={onManual}
                        disabled={isLoading}
                        style={{
                            background: 'transparent', border: 'none',
                            color: '#6B7280', fontSize: '15px', fontWeight: '500',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            padding: '10px', transition: 'color 0.2s ease',
                            opacity: isLoading ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.color = '#374151'; }}
                        onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.color = '#6B7280'; }}
                    >
                        {t('location_permission.manual', { defaultValue: 'Enter location manually' })}
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const LocationBanner = ({ show, onEnable }) => null;

export default LocationPermissionCard;
