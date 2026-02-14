import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const NotificationPermissionModal = ({ isOpen, onClose, onEnable, onNotNow }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', inset: 0, zIndex: 4000,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                padding: '24px', pointerEvents: 'none'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%', maxWidth: '400px',
                        backgroundColor: 'white',
                        borderRadius: '24px',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        marginBottom: '20px',
                        textAlign: isRTL ? 'right' : 'left'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            backgroundColor: '#EFF6FF', color: '#2563EB',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Bell size={24} />
                        </div>
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginBottom: '8px' }}>
                        {t('notifications.title', 'Stay updated on your ride')}
                    </h3>
                    <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.5', marginBottom: '24px' }}>
                        {t('notifications.body', 'Enable notifications to get real-time route changes, delays, and arrival alerts for your bus and train bookings.')}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <button
                            onClick={onNotNow}
                            style={{
                                flex: 1, padding: '14px',
                                backgroundColor: '#F3F4F6', color: '#4B5563',
                                border: 'none', borderRadius: '16px',
                                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            {t('notifications.not_now', 'Not Now')}
                        </button>
                        <button
                            onClick={onEnable}
                            style={{
                                flex: 1, padding: '14px',
                                backgroundColor: '#1E293B', color: 'white',
                                border: 'none', borderRadius: '16px',
                                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            {t('notifications.enable', 'Enable')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default NotificationPermissionModal;
