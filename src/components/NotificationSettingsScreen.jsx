import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Bell, MessageSquare, Shield, Clock, Info, Smartphone, Eye, EyeOff, Sparkles, Moon, Navigation, ShieldAlert } from 'lucide-react';
import haptics from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { requestNotificationPermissionAndSubscribe } from '../services/fcmService';

const NotificationSettingsScreen = ({ onBack }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const user = auth.currentUser;
    const isGuest = !user;

    const [pushPermissionStatus, setPushPermissionStatus] = useState('default');
    const [isPushLoading, setIsPushLoading] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setPushPermissionStatus(Notification.permission);
        }
    }, []);

    const handleEnableSystemPush = async () => {
        setIsPushLoading(true);
        const result = await requestNotificationPermissionAndSubscribe();
        if (result.success) {
            setPushPermissionStatus('granted');
        } else {
            setPushPermissionStatus(Notification.permission);
            alert(result.error === 'Permission denied' ? "Push Permission Denied in browser settings." : "Failed to subscribe to push notifications.");
        }
        setIsPushLoading(false);
    };

    // Default Preferences
    const defaultPreferences = {
        tripUpdates: true,
        liveJourney: true,
        safetyAlerts: true,
        generalUpdates: false,
        dnd: {
            enabled: false,
            start: "22:00",
            end: "06:00"
        }
    };

    // CACHE-FIRST INITIALIZATION
    const [preferences, setPreferences] = useState(() => {
        if (isGuest) return defaultPreferences;
        try {
            const cached = localStorage.getItem(`notification_prefs_${user.uid}`);
            return cached ? JSON.parse(cached) : defaultPreferences;
        } catch (e) {
            return defaultPreferences;
        }
    });

    // Background Sync
    useEffect(() => {
        if (isGuest) return;

        const fetchPrefs = async () => {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().notifications) {
                    const remotePrefs = { ...defaultPreferences, ...docSnap.data().notifications };
                    setPreferences(remotePrefs);
                    localStorage.setItem(`notification_prefs_${user.uid}`, JSON.stringify(remotePrefs));
                }
            } catch (err) {
                console.error("Error fetching notification prefs:", err);
            }
        };

        fetchPrefs();
    }, [user, isGuest]);

    // Handle Toggle
    const handleToggle = async (key, subKey = null) => {
        haptics.light();

        let newPrefs;
        if (subKey) {
            // Handle nested objects like DND
            newPrefs = {
                ...preferences,
                [key]: {
                    ...preferences[key],
                    [subKey]: !preferences[key][subKey]
                }
            };
        } else {
            // Safety Check
            // Removed confirmation dialog as per 'No blocking alerts' rule
            if (key === 'safetyAlerts') {
                // Just proceed
            }
            newPrefs = { ...preferences, [key]: !preferences[key] };
        }


        // Optimistic Update
        setPreferences(newPrefs);
        if (!isGuest) {
            localStorage.setItem(`notification_prefs_${user.uid}`, JSON.stringify(newPrefs));

            // Sync to Firestore
            try {
                const docRef = doc(db, "users", user.uid);
                await setDoc(docRef, { notifications: newPrefs }, { merge: true });
            } catch (err) {
                console.error("Error saving prefs:", err);
            }
        }
    };

    const handleTimeChange = async (type, value) => {
        const newPrefs = {
            ...preferences,
            dnd: {
                ...preferences.dnd,
                [type]: value
            }
        };
        setPreferences(newPrefs);
        if (!isGuest) {
            localStorage.setItem(`notification_prefs_${user.uid}`, JSON.stringify(newPrefs));

            // Debounce Firestore save could be added here preferably, but for MVP direct save is okay
            try {
                const docRef = doc(db, "users", user.uid);
                await setDoc(docRef, { notifications: newPrefs }, { merge: true });
            } catch (err) {
                console.error("Error saving prefs:", err);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: '#F3F4F6', zIndex: 100,
            display: 'flex', flexDirection: 'column',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                backgroundColor: '#FFFFFF', borderBottom: '1px solid #F3F4F6',
                zIndex: 20
            }}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.light(); onBack(); }}
                    style={{
                        background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '50%',
                        width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={22} color="#1F2937" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </motion.button>
                <div>
                    <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                        {t('notifications.title')}
                    </h1>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '120px' }}>
                
                {/* GLOBAL PUSH OPT-IN */}
                {pushPermissionStatus !== 'granted' && !isGuest && (
                    <div style={{
                        backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5',
                        borderRadius: '16px', padding: '16px', marginBottom: '24px',
                        display: 'flex', flexDirection: 'column', gap: '12px'
                    }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ padding: '8px', backgroundColor: '#FEE2E2', borderRadius: '50%' }}>
                                <Bell size={20} color="#EF4444" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#991B1B' }}>Device Push Disabled</h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#B91C1C', marginTop: '2px' }}>Enable notifications to receive live broadcasts.</p>
                            </div>
                        </div>
                        <button
                            onClick={handleEnableSystemPush}
                            disabled={isPushLoading}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '10px',
                                backgroundColor: '#DC2626', color: '#FFFFFF', fontWeight: '600',
                                border: 'none', fontSize: '14px', cursor: 'pointer',
                                opacity: isPushLoading ? 0.7 : 1
                            }}
                        >
                            {isPushLoading ? 'Connecting...' : 'Enable Push Notifications'}
                        </button>
                    </div>
                )}

                <SectionHeader title={t('notifications.category_alerts')} />

                <ToggleItem
                    icon={MessageSquare}
                    title={t('notifications.trip_updates')}
                    description={t('notifications.trip_updates_desc')}
                    isOn={preferences.tripUpdates}
                    onToggle={() => handleToggle('tripUpdates')}
                    color="#6366F1"
                />
                <ToggleItem
                    icon={Smartphone}
                    title={t('notifications.live_journey')}
                    description={t('notifications.live_journey_desc')}
                    isOn={preferences.liveJourney}
                    onToggle={() => handleToggle('liveJourney')}
                    color="#3B82F6"
                />
                <ToggleItem
                    icon={Shield}
                    title={t('notifications.safety_alerts')}
                    description={t('notifications.safety_alerts_desc')}
                    isOn={preferences.safetyAlerts}
                    onToggle={() => handleToggle('safetyAlerts')}
                    color="#EF4444"
                    isCritical
                />

                <div style={{ padding: '0 8px 12px 8px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('notifications.general')}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                    <ToggleItem
                        icon={Bell}
                        title={t('notifications.general_updates')}
                        description={t('notifications.general_updates_desc')}
                        isOn={preferences.generalUpdates}
                        onToggle={() => handleToggle('generalUpdates')}
                        color="#10B981"
                    />
                </div>

                <div style={{ padding: '0 8px 12px 8px' }}>
                    <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t('notifications.advanced')}
                    </h2>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E5E7EB', padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={20} color="#D97706" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1F2937' }}>{t('notifications.dnd')}</span>
                                <Switch isOn={preferences.dnd.enabled.toString()} onToggle={() => handleToggle('dnd', 'enabled')} />
                            </div>
                            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', lineHeight: '1.4' }}>
                                {t('notifications.dnd_desc')}
                            </p>
                        </div>
                    </div>

                    <AnimatePresence>
                        {preferences.dnd.enabled && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{
                                    borderTop: '1px solid #F1F5F9', marginTop: '20px', paddingTop: '20px',
                                    display: 'flex', alignItems: 'center', gap: '20px'
                                }}>

                                    {/* Start Time */}
                                    {/* Note: In a real mobile app, native time pickers are better. Using HTML time input for PWA/Web MVP */}
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '8px' }}>{t('notifications.start_time')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="time"
                                                value={preferences.dnd.start}
                                                onChange={(e) => handleTimeChange('start', e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                                    fontSize: '15px', fontWeight: '600', color: '#1F293B', outline: 'none', backgroundColor: '#F8FAFC'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* End Time */}
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: '8px' }}>{t('notifications.end_time')}</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="time"
                                                value={preferences.dnd.end}
                                                onChange={(e) => handleTimeChange('end', e.target.value)}
                                                style={{
                                                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0',
                                                    fontSize: '15px', fontWeight: '600', color: '#1F293B', outline: 'none', backgroundColor: '#F8FAFC'
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {isGuest && (
                    <div style={{ padding: '16px', backgroundColor: '#EFF6FF', borderRadius: '12px', marginTop: '24px' }}>
                        <p style={{ fontSize: '13px', color: '#1E3A8A', margin: 0, lineHeight: '1.5' }}>
                            <strong>Note:</strong> Since you are using a Guest account, these settings are saved only on this device. Log in to sync preferences across devices.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// SUB-COMPONENTS
// ------------------------------------------------------------------

const SectionHeader = ({ title }) => (
    <div style={{
        fontSize: '13px', fontWeight: 600, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', marginTop: '8px'
    }}>
        {title}
    </div>
);

const ToggleItem = ({ icon: Icon, color, title, description, isOn, onToggle, isCritical = false }) => (
    <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '16px 20px',
        marginBottom: '16px', border: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, paddingRight: '16px' }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={20} color={color} />
            </div>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F293B' }}>{title}</div>
                    {isCritical && !isOn && (
                        <ShieldAlert size={14} color="#EF4444" />
                    )}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>
                    {description}
                </div>
            </div>
        </div>
        <Switch isOn={isOn.toString()} onToggle={onToggle} />
    </div>
);

const Switch = ({ isOn, onToggle }) => (
    <motion.div
        className={`switch ${isOn === 'true' ? 'on' : 'off'}`}
        onClick={onToggle}
        style={{
            width: '50px', height: '30px', backgroundColor: isOn === 'true' ? '#10B981' : '#E2E8F0',
            borderRadius: '50px', display: 'flex', alignItems: 'center', padding: '2px', cursor: 'pointer',
            justifyContent: isOn === 'true' ? 'flex-end' : 'flex-start', flexShrink: 0,
            transition: 'background-color 0.2s'
        }}
    >
        <motion.div
            layout
            transition={{ type: "spring", stiffness: 700, damping: 30 }}
            style={{
                width: '26px', height: '26px', backgroundColor: '#FFFFFF', borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
        />
    </motion.div>
);

export default NotificationSettingsScreen;
