import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import LanguageSettingsScreen from './LanguageSettingsScreen';

import {
    User, ChevronRight, Shield, Lock, Bus, Map as MapIcon,
    Ticket, History, CreditCard, Wallet, FileText, RefreshCw,
    Phone, LogOut, ArrowLeft, Layout, Smartphone, LogIn, ScrollText,
    HelpCircle, Settings as SettingsIcon, Bell, AlertTriangle, Globe
} from 'lucide-react';
// LoginScreen import removed
import SafetyScreen from './SafetyScreen';
import haptics from '../utils/haptics';
import GlobalLoader from './GlobalLoader';
import EmailSuccessScreen from './EmailSuccessScreen';
import UserDetailsScreen from './UserDetailsScreen';
import YourTripsScreen from './YourTripsScreen'; // Import added
import NotificationSettingsScreen from './NotificationSettingsScreen';
import yourTripsIcon from './LottieAnimations/profileicons/routing-2.svg';
import profileCircleIcon from './LottieAnimations/profileicons/profile-circle.svg';
import termsIcon from './LottieAnimations/profileicons/receipt-edit.svg';
import privacyIcon from './LottieAnimations/profileicons/lock.svg';
import refundIcon from './LottieAnimations/profileicons/repeat-arrow.svg';
import contactIcon from './LottieAnimations/profileicons/tag-user.svg';
import safetyIcon from './LottieAnimations/profileicons/shield-tick-5.svg';
import logoutIcon from './LottieAnimations/profileicons/logout-02.svg';
import defaultProfileIcon from './LottieAnimations/profileicons/profile.svg';
import languageIcon from './LottieAnimations/profileicons/icons8-language.svg';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/* ------------------- SKELETON LOADER ------------------- */
const ProfileSkeleton = () => (
    <div style={{ padding: '24px', maxWidth: '768px', margin: '0 auto', width: '100%' }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ width: '120px', height: '32px', backgroundColor: '#F3F4F6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '180px', height: '16px', backgroundColor: '#F3F4F6', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F3F4F6', animation: 'pulse 1.5s infinite' }}></div>
        </div>

        {/* Section Skeleton */}
        <div style={{ marginBottom: '32px' }}>
            <div style={{ width: '140px', height: '20px', backgroundColor: '#F3F4F6', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ width: '100%', height: '72px', backgroundColor: '#F3F4F6', borderRadius: '20px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}></div>
            <div style={{ width: '100%', height: '72px', backgroundColor: '#F3F4F6', borderRadius: '20px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}></div>
        </div>

        <style>{`
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `}</style>
    </div>
);

/* ------------------- UI COMPONENTS ------------------- */

const PillComponent = ({ icon: Icon, label, subLabel, onClick, rightElement, iconColor = '#4B5563', textColor = '#1F2937', isLocked = false, customIcon = null, isRTL }) => (
    <motion.div
        whileTap={{ scale: 0.96 }}
        onClick={() => {
            haptics.light();
            onClick && onClick();
        }}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 20px',
            cursor: 'pointer',
            backgroundColor: '#FFFFFF', // White
            borderRadius: '20px',
            marginBottom: '8px',
            position: 'relative',
            opacity: isLocked ? 0.7 : 1,
            transition: 'transform 0.1s ease, background-color 0.2s',
            border: '1px solid transparent',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'} // Hover effect
    >
        <div style={{
            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginRight: isRTL ? '0' : '16px',
            marginLeft: isRTL ? '16px' : '0',
            flexShrink: 0,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            overflow: 'hidden' // Ensure image stays within circle
        }}>
            {isLocked ? (
                <Lock size={18} color="#9CA3AF" />
            ) : customIcon ? (
                <img src={customIcon} alt={label} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            ) : (
                Icon && <Icon size={20} color={iconColor} strokeWidth={2.2} />
            )}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: isRTL ? 'right' : 'left' }}>
            <span style={{ fontSize: '16px', fontWeight: '700', color: textColor }}>{label}</span>
            {subLabel && <span style={{ fontSize: '13px', color: '#3C3C43', fontWeight: '400', marginTop: '2px' }}>{subLabel}</span>}
        </div>
        {rightElement ? rightElement : <ChevronRight size={20} color="#D1D5DB" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />}
    </motion.div>
);

const Pill = (props) => {
    const { isRTL } = useLanguage();
    return <PillComponent {...props} isRTL={isRTL} />;
};



/* ------------------- MAIN COMPONENT ------------------- */

const ProfileScreenContent = ({ user, authStatus, onNavigate, onLegalNavigate, onBack, onLogout }) => {
    const { t } = useTranslation();
    const { currentLanguage, languages, isRTL } = useLanguage();

    // Debug Logging
    console.log('ProfileScreenContent Render:', { authStatus, user });

    // Local state for profile photo and internal navigation
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [firestoreDisplayName, setFirestoreDisplayName] = useState(null);
    const [currentView, setCurrentView] = useState('main'); // 'main' | 'safety' | 'language' ...

    useEffect(() => {
        const fetchProfilePhoto = async () => {
            if (user?.photoURL) {
                setProfilePhoto(user.photoURL);
                return;
            }
            if (user?.uid) {
                try {
                    const docSnap = await getDoc(doc(db, "users", user.uid));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.photoUrl || data.photoURL) {
                            setProfilePhoto(data.photoUrl || data.photoURL);
                        }
                        if (data.name) {
                            setFirestoreDisplayName(data.name);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching profile details from Firestore:", err);
                }
            }
        };
        fetchProfilePhoto();
    }, [user, currentView]);

    // 1. Loading State
    if (authStatus === 'loading') {
        return <GlobalLoader message={t('common.loading')} />;
    }

    // 2. Guest Check
    const isGuest = authStatus === 'guest' || !user;

    // 3. Safety Screen / User Details View
    if (currentView === 'safety') {
        return <SafetyScreen onBack={() => setCurrentView('main')} isGuest={isGuest} hasBottomNavSpacing={false} />;
    }
    if (currentView === 'details' && !isGuest) {
        return <UserDetailsScreen onBack={() => setCurrentView('main')} user={user} />;
    }
    if (currentView === 'trips' && !isGuest) {
        return <YourTripsScreen onBack={() => setCurrentView('main')} onBookRide={() => onNavigate('search')} user={user} />;
    }
    if (currentView === 'notifications') {
        return <NotificationSettingsScreen onBack={() => setCurrentView('main')} />;
    }
    if (currentView === 'language') {
        return <LanguageSettingsScreen onBack={() => setCurrentView('main')} />;
    }

    try {
        // 4. Main Authenticated / Guest State
        const displayName = isGuest ? t('common.guest') : (firestoreDisplayName || user.displayName || t('common.traveller'));
        const displayEmail = isGuest ? t('common.welcome') : (user.email || t('common.verified_user'));

        const handleLogout = () => {
            if (onLogout) {
                haptics.medium();
                onLogout();
            }
        };

        return (
            <div style={{ padding: '0 16px', maxWidth: '768px', margin: '0 auto', width: '100%', paddingBottom: '24px', direction: isRTL ? 'rtl' : 'ltr' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 8px 32px 8px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#1C1C1E', margin: 0 }}>{displayName}</h1>
                        <p style={{ fontSize: '15px', color: '#3C3C43', marginTop: '4px', fontWeight: '400' }}>{displayEmail}</p>
                    </div>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '4px solid #F8FAFC', overflow: 'hidden' }}>
                        {!isGuest && profilePhoto ? (
                            <img src={profilePhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9' }}>
                                <img src={defaultProfileIcon} alt="Default Profile" style={{ width: '32px', height: '32px', opacity: 0.5 }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Section - Hidden for Guest */}
                {!isGuest && (
                    <>
                        <Pill
                            customIcon={profileCircleIcon}
                            label={t('profile.your_details')}
                            subLabel={displayEmail}
                            onClick={() => setCurrentView('details')}
                        />
                        <Pill
                            customIcon={yourTripsIcon}
                            label={t('profile.your_trips')}
                            subLabel={t('profile.trips_history')}
                            onClick={() => setCurrentView('trips')}
                        />
                    </>
                )}

                <Pill
                    customIcon={languageIcon}
                    label={t('profile.language')}
                    subLabel={languages.find(l => l.code === currentLanguage)?.nativeName || t('profile.select_language')}
                    onClick={() => setCurrentView('language')}
                    iconColor="#3B82F6"
                />

                {/* Safety & Settings Section */}


                {/* NEW: Safety Center Pill */}
                <Pill
                    customIcon={safetyIcon}
                    label={t('profile.safety_center')}
                    subLabel={t('profile.safety_subtitle')}
                    onClick={() => setCurrentView('safety')}
                    iconColor="#3B82F6"
                />


                <Pill customIcon={termsIcon} label={t('profile.terms')} onClick={() => onLegalNavigate('terms')} />
                <Pill customIcon={privacyIcon} label={t('profile.privacy')} onClick={() => onLegalNavigate('privacy-policy')} />
                <Pill customIcon={refundIcon} label={t('profile.refund')} onClick={() => onLegalNavigate('refund')} />

                {/* Support Section */}

                <Pill customIcon={contactIcon} label={t('profile.support')} subLabel="support@nexride.co.in" onClick={() => onLegalNavigate('contact')} />

                <div style={{ marginTop: '16px' }}>
                    <Pill customIcon={logoutIcon} label={t('profile.logout')} textColor="#000000" onClick={handleLogout} />
                </div>


                <div style={{ textAlign: 'center', marginTop: '32px', color: '#CBD5E1', fontSize: '12px' }}>
                    {t('profile.version')}
                </div>
            </div>
        );
    } catch (error) {
        console.error("ProfileScreen Render Error:", error);
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>
                <h3>{t('profile.error_title')}</h3>
                <p>{error.message}</p>
                <button onClick={onBack}>{t('profile.go_back')}</button>
            </div>
        );
    }
};



const ProfileScreen = ({ user, authStatus, onNavigate, onLegalNavigate, onBack, onLogout }) => {
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const prevAuthStatusRef = React.useRef(authStatus);

    useEffect(() => {
        // Trigger animation ONLY when transitioning from 'guest' to 'authenticated'
        // This means a fresh login/signup occurred.
        if (prevAuthStatusRef.current === 'guest' && authStatus === 'authenticated' && user) {
            if (!user.isAnonymous) {
                setShowSuccessAnimation(true);
            }
        }
        prevAuthStatusRef.current = authStatus;
    }, [authStatus, user]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: '80px', // Leave space for BottomNav
            zIndex: 60, // Below BottomNav (70)
            backgroundColor: '#ffffff',
            overflowY: 'auto',
            width: '100%',
        }}>
            {showSuccessAnimation && (
                <EmailSuccessScreen onComplete={() => setShowSuccessAnimation(false)} />
            )}

            <ProfileScreenContent
                user={user}
                authStatus={authStatus}
                onNavigate={onNavigate}
                onLegalNavigate={onLegalNavigate}
                onBack={onBack}
                onLogout={onLogout}
            />
        </div>
    );
};

export default ProfileScreen;
