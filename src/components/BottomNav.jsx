import React from 'react';
import haptics from '../utils/haptics';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

import ReferenceIcon from './LottieAnimations/profileicons/iconsax-ai-homepage-njtmxgyx-.svg?react'; // Keeping ref for now

import HomeIcon from './LottieAnimations/profileicons/iconsax-ai-homepage-njtmxgyx-.svg?react';
import TicketIcon from './LottieAnimations/profileicons/iconsax-ticket-u9gfewzf-.svg?react';
import RideIcon from './LottieAnimations/profileicons/iconsax-menu-n87aqakk-.svg?react';
// SafetyIcon removed
import ProfileIcon from './LottieAnimations/profileicons/iconsax-user-p6s26kte-.svg?react';

const BottomNav = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const tabs = [
        { id: 'home', label: t('nav.home'), icon: HomeIcon },
        { id: 'tickets', label: t('nav.tickets'), icon: TicketIcon },
        { id: 'ride', label: t('nav.ride'), icon: RideIcon }, // New Ride Tab
        { id: 'profile', label: t('nav.profile'), icon: ProfileIcon },
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '12px 0 24px 0', // Extra padding at bottom for iOS home bar area
            zIndex: 70, // Above Profile(60)
            transition: 'transform 0.3s ease'
        }}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            haptics.light();
                            onTabChange(tab.id);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: isActive ? '#000000ff' : '#8E8E93', // Active: Black, Inactive: Grey
                            flex: 1,
                            padding: '4px',
                            transition: 'color 0.2s ease',
                            outline: 'none',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                    >
                        <Icon
                            width={24}
                            height={24}
                            fill="currentColor"
                            isActive={isActive}
                        />
                        <span style={{
                            fontSize: '12px',
                            marginTop: '4px',
                            fontWeight: isActive ? '600' : '400'
                        }}>
                            {tab.label}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
};

export default BottomNav;
