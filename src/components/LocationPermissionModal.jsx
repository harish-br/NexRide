import { MapPin, Car, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const BRAND_COLOR = '#1569FD';

export const LocationPermissionCard = ({ isOpen, onClose, onAllow, onManual, isLoading }) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    // Minimal Hardcoded Fallbacks
    const strings = {
        title: t('location_permission.title', { defaultValue: 'Enable Location' }),
        body: t('location_permission.body', { defaultValue: 'NexRide uses your location to find nearby rides and set accurate pickup points.' }),
        benefits: [
            t('location_permission.benefit_1', { defaultValue: 'Nearby drivers' }),
            t('location_permission.benefit_2', { defaultValue: 'Accurate pickup' }),
            t('location_permission.benefit_3', { defaultValue: 'Safer rides' })
        ],
        allow: t('location_permission.allow', { defaultValue: 'Use My Location' }),
        manual: t('location_permission.manual', { defaultValue: 'Choose manually' })
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 3000,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.05)' // Very soft overlay
            }}>
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: '420px',
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        padding: '12px 24px 32px 24px',
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.06)',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid rgba(0,0,0,0.03)'
                    }}
                >
                    {/* Subtle Drag Handle */}
                    <div style={{
                        width: '32px', height: '4px', backgroundColor: '#F3F4F6',
                        borderRadius: '2px', alignSelf: 'center', marginBottom: '20px'
                    }} />

                    {/* Content Section */}
                    <div style={{ marginBottom: '16px' }}>
                        <h2 style={{
                            fontSize: '22px', fontWeight: '600', color: '#111',
                            margin: '0 0 12px 0', letterSpacing: '-0.01em'
                        }}>
                            {strings.title}
                        </h2>
                        <p style={{
                            fontSize: '15px', color: '#6B7280', lineHeight: '1.5',
                            margin: 0
                        }}>
                            {strings.body}
                        </p>
                    </div>

                    {/* Simplified Benefit List */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: '12px',
                        marginBottom: '32px'
                    }}>
                        {[
                            { icon: <Car size={16} /> },
                            { icon: <MapPin size={16} /> },
                            { icon: <ShieldCheck size={16} /> }
                        ].map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ color: BRAND_COLOR, opacity: 0.8 }}>
                                    {item.icon}
                                </div>
                                <span style={{ fontSize: '14px', color: '#4B5563', fontWeight: '450' }}>
                                    {strings.benefits[idx]}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            whileHover={isLoading ? {} : { scale: 1.01 }}
                            whileTap={isLoading ? {} : { scale: 0.98 }}
                            onClick={onAllow}
                            disabled={isLoading}
                            style={{
                                width: '100%', height: '52px',
                                backgroundColor: isLoading ? '#EEF2FF' : BRAND_COLOR,
                                color: isLoading ? BRAND_COLOR : 'white',
                                border: 'none', borderRadius: '16px',
                                fontSize: '16px', fontWeight: '600',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                boxShadow: isLoading ? 'none' : `0 8px 24px ${BRAND_COLOR}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {isLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        style={{ display: 'flex' }}
                                    >
                                        <Loader2 size={20} strokeWidth={3} />
                                    </motion.div>
                                    <span style={{ fontSize: '15px' }}>{t('location_permission.fetching', 'Fetching Location...')}</span>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MapPin size={18} strokeWidth={2.5} />
                                    {strings.allow}
                                </div>
                            )}
                        </motion.button>

                        <button
                            onClick={onManual}
                            disabled={isLoading}
                            style={{
                                background: 'none', border: 'none',
                                color: '#94A3B8',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                padding: '8px',
                                transition: 'color 0.2s ease',
                                opacity: isLoading ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#64748B'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
                        >
                            {strings.manual}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export const LocationBanner = ({ show, onEnable }) => null;

export default LocationPermissionCard;
