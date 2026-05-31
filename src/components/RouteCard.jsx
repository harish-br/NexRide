import React from 'react';
import { motion } from 'framer-motion';
import { Bus, Train, User as Walk, ChevronRight, Zap, PiggyBank, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StepChip = ({ step }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'WALK': return <Walk size={14} color="#6B7280" />;
            case 'BUS': return <Bus size={14} color="#2563EB" />;
            case 'TRAIN': return <Train size={14} color="#EA4335" />;
            default: return null;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: '#F9FAFB',
            borderRadius: '16px',
            padding: '10px 14px',
            minWidth: '80px',
            border: '1px solid #F3F4F6'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                {getIcon(step.type)}
                {step.routeNumber && (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {step.routeNumber}
                    </span>
                )}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '500' }}>
                {step.type === 'WALK' ? `${step.distanceMeters}m` : `₹${step.fare}`}
            </div>
        </div>
    );
};

const RouteCard = ({ route, onSelect }) => {
    const { t } = useTranslation();
    const getLabelStyles = (label) => {
        switch (label) {
            case 'EARLIEST': return { bg: '#EEF2FF', color: '#4F46E5', icon: <Zap size={12} />, text: t('ride.labels.earliest') };
            case 'AFFORDABLE': return { bg: '#ECFDF5', color: '#10B981', icon: <PiggyBank size={12} />, text: t('ride.labels.affordable') };
            case 'HYBRID': return { bg: '#FFF7ED', color: '#F97316', icon: <Scale size={12} />, text: t('ride.labels.hybrid') };
            default: return { bg: '#F3F4F6', color: '#6B7280', icon: null, text: label };
        }
    };

    const labelStyle = getLabelStyles(route.label);

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onSelect}
            style={{
                background: 'white',
                borderRadius: '24px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                border: '1px solid #F3F4F6',
                cursor: 'pointer'
            }}
        >
            {/* Header: Distance, Label, and Total Fare */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>
                        {t('ride.trip_distance', { distance: route.totalDistanceKm })}
                    </span>
                    <div style={{
                        background: labelStyle.bg,
                        color: labelStyle.color,
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        textTransform: 'uppercase'
                    }}>
                        {labelStyle.icon}
                        {labelStyle.text}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '14px', color: '#111827', fontWeight: '600' }}>₹</span>
                    <span style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>
                        {route.totalFare}
                    </span>
                </div>
            </div>

            {/* Starting In Info */}
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '16px', fontWeight: '500' }}>
                {t('ride.starting_in', { minutes: route.startInMinutes })}
            </div>

            {/* Steps Timeline (Horizontal Row of Chips) */}
            <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
                {route.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                        <StepChip step={step} />
                        {idx < route.steps.length - 1 && (
                            <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </motion.div>
    );
};

export default RouteCard;
