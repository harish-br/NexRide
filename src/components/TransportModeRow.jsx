import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Train, Calendar, Ticket, MapPin, TramFront } from 'lucide-react';
import haptics from '../utils/haptics';
import { useTranslation } from 'react-i18next';

const modes = [
    { type: 'image', src: '/icons/bus_3d.jpg', label: 'Bus', translationKey: 'home.modes.bus', color: '#E0F2FE' }, // Light Blue
    { type: 'image', src: '/icons/train_new_square.jpg', label: 'Train', translationKey: 'home.modes.train', color: '#FEF3C7' }, // Light Orange/Amber
    { type: 'image', src: '/icons/metro_3d.jpg', label: 'Suburban', translationKey: 'home.modes.suburban', color: '#F3E8FF' }, // Light Purple
    { type: 'image', src: '/icons/nearby_bus_stop_3d_new.png', label: 'Nearby', translationKey: 'home.modes.nearby', color: '#DCFCE7' }, // Light Green
];

const TransportModeRow = ({ onBusClick, onTrainClick, onSuburbanClick, onNearbyClick }) => {
    const { t } = useTranslation();

    const handleClick = (label) => {
        haptics.medium();
        if (label === 'Bus' && onBusClick) onBusClick();
        else if (label === 'Train' && onTrainClick) onTrainClick();
        else if (label === 'Suburban' && onSuburbanClick) onSuburbanClick();
        else if (label === 'Nearby' && onNearbyClick) onNearbyClick();
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '12px 16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '24px',
        }}>
            {modes.map((mode, index) => (
                <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleClick(mode.label)}
                    title={t(mode.translationKey)} // Tooltip
                    aria-label={t(mode.translationKey)} // Accessibility
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        flex: 1
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            width: '56px',
                            height: '56px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'black',
                            background: mode.color,
                            borderRadius: '16px',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {mode.type === 'image' ? (
                            <img
                                src={mode.src}
                                alt={t(mode.translationKey)}
                                title={t(mode.translationKey)} // Tooltip
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        ) : (
                            <mode.icon size={28} color="#111" strokeWidth={1.5} />
                        )}
                    </motion.div>
                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                        {t(mode.translationKey)}
                    </span>
                </motion.div>
            ))}
        </div>
    );
};

export default TransportModeRow;
