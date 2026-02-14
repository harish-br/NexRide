import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import {
    ChevronLeft, Shield, MapPin, Clock, Heart, Eye,
    Bell, CheckCircle, Info, Settings, AlertTriangle, ChevronRight
} from 'lucide-react';
import haptics from '../utils/haptics';
import Lottie from 'lottie-react';
import GirlAnimation from './LottieAnimations/Girl.json';
import WomenSafetyAnim from './LottieAnimations/Healthy or Junk food.json';

const ToggleSwitch = ({ isOn, onToggle }) => {
    const { isRTL } = useLanguage();
    return (
        <div
            onClick={onToggle}
            style={{
                width: '48px', height: '28px', borderRadius: '100px',
                backgroundColor: isOn ? '#EC4899' : '#E2E8F0',
                display: 'flex', alignItems: 'center', padding: '2px',
                cursor: 'pointer', transition: 'background-color 0.2s ease',
                position: 'relative'
            }}
        >
            <motion.div
                layout
                initial={false}
                animate={{ x: isOn ? (isRTL ? -20 : 20) : 0 }}
                style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            />
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description, isOn, onToggle, isPro = false }) => {
    const { isRTL } = useLanguage();
    return (
        <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px',
            marginBottom: '16px', border: '1px solid #F3F4F6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            textAlign: isRTL ? 'right' : 'left'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    backgroundColor: '#FDF2F8', color: '#DB2777',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={20} />
                </div>
                {onToggle && <ToggleSwitch isOn={isOn} onToggle={onToggle} />}
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#1F2937', marginBottom: '6px' }}>
                {title}
                {isPro && <span style={{
                    fontSize: '10px', backgroundColor: '#F3E8FF', color: '#7E22CE',
                    padding: '2px 6px', borderRadius: '4px', [isRTL ? 'marginRight' : 'marginLeft']: '8px', textTransform: 'uppercase'
                }}>Beta</span>}
            </h3>
            <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.5', margin: 0 }}>
                {description}
            </p>
        </div>
    );
};

const WomenSafetyScreen = ({ onBack }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [features, setFeatures] = useState({
        smartGuardian: true,
        delayedArrival: true,
        autoCheckins: false
    });

    const toggleFeature = (key) => {
        haptics.light();
        setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleReassurance = () => {
        haptics.success();
        console.log("Reassurance sent: 'I've reached safely' notification sent to trusted contacts.");
    };

    return (
        <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#FFFFFF', zIndex: 50,
            display: 'flex', flexDirection: 'column',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', display: 'flex', alignItems: 'center',
                borderBottom: '1px solid #F1F5F9', backgroundColor: '#FFFFFF',
                flexDirection: isRTL ? 'row-reverse' : 'row'
            }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptics.light(); onBack(); }}
                    style={{ background: 'none', border: 'none', padding: '8px', [isRTL ? 'marginLeft' : 'marginRight']: '8px' }}
                >
                    <ChevronLeft size={24} color="#1E293B" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </motion.button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                    <div style={{ width: '40px', height: '40px' }}>
                        <Lottie
                            animationData={WomenSafetyAnim}
                            loop={false}
                            autoplay={false}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#1E293B', margin: 0 }}>{t('safety.women_safety')}</h1>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>

                {/* Looping Girl Animation */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', marginTop: '12px' }}>
                    <div style={{ width: '280px', height: '160px' }}>
                        <Lottie
                            animationData={GirlAnimation}
                            loop={true}
                            autoplay={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>

                {/* Intro Banner */}
                <div style={{
                    backgroundColor: '#FDF2F8', borderRadius: '16px', padding: '20px', marginBottom: '24px',
                    border: '1px solid #FCE7F3', textAlign: isRTL ? 'right' : 'left'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#BE185D', marginBottom: '8px' }}>
                        {t('safety.women_safety_banner_title')}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#9D174D', lineHeight: '1.5', margin: 0 }}>
                        {t('safety.women_safety_banner_desc')}
                    </p>
                </div>

                {/* 1. Smart Journey Guardian */}
                <FeatureCard
                    icon={Eye}
                    title={t('safety.guardian_title')}
                    description={t('safety.guardian_desc')}
                    isOn={features.smartGuardian}
                    onToggle={() => toggleFeature('smartGuardian')}
                />

                {/* 2. Delayed Arrival Protection */}
                <FeatureCard
                    icon={Clock}
                    title={t('safety.delayed_title')}
                    description={t('safety.delayed_desc')}
                    isOn={features.delayedArrival}
                    onToggle={() => toggleFeature('delayedArrival')}
                />

                {/* 3. Area Awareness */}
                <div style={{
                    marginBottom: '24px', padding: '16px', borderRadius: '16px',
                    backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
                    display: 'flex', gap: '12px', flexDirection: isRTL ? 'row-reverse' : 'row'
                }}>
                    <Info size={20} color="#64748B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>{t('safety.awareness_title')}</h4>
                        <p style={{ fontSize: '13px', color: '#64748B', margin: 0, lineHeight: '1.4' }}>
                            {t('safety.awareness_desc')}
                        </p>
                    </div>
                </div>

                {/* 4. One-Tap Reassurance */}
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px', textAlign: isRTL ? 'right' : 'left' }}>
                        {t('safety.tips')}
                    </h3>
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleReassurance}
                        style={{
                            width: '100%', padding: '20px', borderRadius: '16px',
                            backgroundColor: '#FFFFFF', border: '2px solid #EC4899',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)',
                            flexDirection: isRTL ? 'row-reverse' : 'row'
                        }}
                    >
                        <Heart size={24} color="#EC4899" fill="#EC4899" />
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#BE185D' }}>{t('safety.reached_safely')}</span>
                    </motion.button>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#9CA3AF', marginTop: '8px' }}>
                        {t('safety.reached_safely_desc')}
                    </p>
                </div>

                {/* 5. Auto Safety Check-ins */}
                <FeatureCard
                    icon={CheckCircle}
                    title={t('safety.auto_checkin_title')}
                    description={t('safety.auto_checkin_desc')}
                    isOn={features.autoCheckins}
                    onToggle={() => toggleFeature('autoCheckins')}
                    isPro={true}
                />

                {/* 6. Preferences */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                            <Settings size={20} color="#64748B" />
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#374151' }}>{t('safety.customize')}</span>
                        </div>
                        <span style={{ fontSize: '13px', color: '#EC4899', fontWeight: '600', cursor: 'pointer' }}>{t('safety.edit')}</span>
                    </div>
                </div>

                {/* 7. Privacy Section */}
                <div style={{ padding: '24px', backgroundColor: '#F9FAFB', borderRadius: '20px', textAlign: 'center' }}>
                    <Shield size={24} color="#9CA3AF" style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', margin: 0 }}>
                        {t('safety.privacy_note')}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default WomenSafetyScreen;
