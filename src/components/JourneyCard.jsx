import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import haptics from '../utils/haptics';

const JourneyCard = ({ onClick, userAddress }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                haptics.light();
                onClick();
            }}
            style={{
                background: 'linear-gradient(110deg, #0055FF 0%, #FF0077 100%)',
                borderRadius: '28px',
                padding: '20px 20px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 85, 255, 0.15)',
                marginBottom: '16px',
                cursor: 'pointer'
            }}
        >
            <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px', fontWeight: 500 }}>
                    {userAddress ? `${userAddress}` : t('home.plan_journey')}
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 600, lineHeight: 1.2, marginBottom: '16px', letterSpacing: '-0.3px', whiteSpace: 'pre-line' }}>
                    {t('home.where_to_go')}
                </h2>

                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 600
                }}>
                    {t('home.start_search')} <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                </div>
            </div>

            {/* Watermark Icon */}
            <motion.div
                animate={{
                    rotate: [-15, -25, -15],
                    scale: [1, 1.05, 1]
                }}
                transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    right: '-30px',
                    bottom: '-30px',
                    opacity: 0.1,
                }}
            >
                <MapPin size={140} color="white" />
            </motion.div>
        </motion.div>
    );
};

export default JourneyCard;
