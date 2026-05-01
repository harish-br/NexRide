import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Bus, Train, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import haptics from '../utils/haptics';

const TicketScreen = ({
    isVisible,
    onClose,
    routeData,
    selectedRoute,
    overrideFare,
    passengerCount = 1,
    onProceedPayment,
    isLoading = false,
    paymentStatus = 'idle'
}) => {
    const { t } = useTranslation();
    const [baseFare, setBaseFare] = useState(null);
    const [passengers, setPassengers] = useState(1);
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate base fare when route data changes
    useEffect(() => {
        if (isVisible) {
            if (overrideFare) {
                // Important: calculate individual base fare if total is provided
                setBaseFare(overrideFare / (passengerCount || 1));
                return;
            }
            if (routeData) {
                const distanceStr = routeData.distance || '0 km';
                const distance = parseFloat(distanceStr.replace(/[^0-9.]/g, ''));
                let ratePerKm = 1.5;
                if (selectedRoute?.type === 'train') ratePerKm = 0.8;
                let calculatedFare = Math.round(distance * ratePerKm);
                if (calculatedFare < 10) calculatedFare = 10;
                setBaseFare(calculatedFare);
            }
        }
    }, [isVisible, routeData, selectedRoute, overrideFare]);

    // Reset state when sheet opens
    useEffect(() => {
        if (isVisible) {
            setPassengers(passengerCount || 1);
            setIsExpanded(false);
        }
    }, [isVisible, passengerCount]);

    const totalFare = baseFare ? baseFare * passengers : null;

    if (!isVisible) return null;

    const originName = routeData?.origin?.name?.split(',')[0] || t('ticket.origin');
    const destName = (() => {
        const dest = routeData?.destination;
        if (!dest) return t('ticket.destination');
        if (typeof dest === 'string') return dest.split(',')[0];
        return dest.name?.split(',')[0] || t('ticket.destination');
    })();

    return (
        <AnimatePresence>
            <motion.div
                key="ticket-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 5000,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                }}
            >
                {/* Backdrop */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                    }}
                    onClick={() => { haptics.light(); onClose(); }}
                />

                {/* Card — slides in from bottom, NO layout animation */}
                <motion.div
                    key="ticket-card"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 32, stiffness: 260, mass: 0.85 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '450px',
                        backgroundColor: '#FFFFFF',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        padding: '20px 24px 40px',
                        pointerEvents: 'auto',
                        boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
                        overflow: 'hidden',
                        cursor: isExpanded ? 'default' : 'pointer',
                    }}
                    onClick={() => {
                        if (!isExpanded) { setIsExpanded(true); haptics.light(); }
                    }}
                >
                    {/* Drag handle + Close button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px', position: 'relative' }}>
                        <div
                            onClick={(e) => { e.stopPropagation(); if (isExpanded) setIsExpanded(false); }}
                            style={{
                                width: '40px', height: '5px',
                                backgroundColor: '#E5E7EB', borderRadius: '99px',
                                cursor: isExpanded ? 'pointer' : 'default',
                            }}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); haptics.light(); onClose(); }}
                            style={{
                                position: 'absolute', right: 0, top: '-8px',
                                background: '#F3F4F6', border: 'none',
                                borderRadius: '50%', width: '32px', height: '32px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={16} color="#6B7280" />
                        </button>
                    </div>

                    {/* ── Route Info (always visible, never reflowing) ── */}
                    <div style={{ marginBottom: '20px', padding: '0 2px' }}>
                        <div style={{
                            fontWeight: 700, fontSize: '17px', color: '#111',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            lineHeight: '1.4',
                        }}>
                            {originName}
                            <span style={{ margin: '0 8px', color: '#9CA3AF', fontWeight: 400 }}>→</span>
                            {destName}
                        </div>
                        <div style={{
                            fontSize: '14px', color: '#6B7280', fontWeight: 600,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            marginTop: '3px',
                        }}>
                            {selectedRoute?.name || 'A.S.M Bus'}
                        </div>
                        <div style={{
                            fontSize: '13px', color: '#9CA3AF', fontWeight: 500,
                            whiteSpace: 'nowrap', marginTop: '2px',
                        }}>
                            {selectedRoute?.departureTime ? `Departs at ${selectedRoute.departureTime}` : 'Departs at --'}
                        </div>
                    </div>

                    {/* ── Passenger row (always visible) ── */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        height: '36px', // fixed — prevents layout shift
                        marginBottom: '20px',
                    }}>
                        {/* Label */}
                        <div style={{
                            fontSize: '15px', fontWeight: 600, color: '#374151',
                            flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {isExpanded ? `Adult (₹${baseFare})` : 'Ticket payment information'}
                        </div>

                        {/* Passenger selector pill */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            background: '#F3F4F6', borderRadius: '20px',
                            padding: '5px 10px', gap: '6px',
                            flexShrink: 0,
                        }}>
                            {/* Minus — visible in expanded mode */}
                            {isExpanded && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (passengers > 1) { setPassengers(p => p - 1); haptics.light(); }
                                    }}
                                    style={{
                                        background: 'transparent', border: 'none',
                                        fontSize: '18px', fontWeight: 600,
                                        color: passengers === 1 ? '#D1D5DB' : '#374151',
                                        cursor: passengers === 1 ? 'not-allowed' : 'pointer',
                                        padding: '0', lineHeight: 1,
                                    }}
                                >−</button>
                            )}

                            {/* Count */}
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#111', minWidth: '22px', textAlign: 'center' }}>
                                {passengers.toString().padStart(2, '0')}
                            </span>

                            {/* Person icon in collapsed */}
                            {!isExpanded && <span style={{ fontSize: '14px' }}>👤</span>}

                            {/* Divider */}
                            <div style={{ width: '1px', height: '14px', background: '#D1D5DB' }} />

                            {/* Plus */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (passengers < 4) { setPassengers(p => p + 1); haptics.light(); }
                                }}
                                style={{
                                    background: 'transparent', border: 'none',
                                    fontSize: '18px', fontWeight: 600,
                                    color: passengers === 4 ? '#D1D5DB' : '#374151',
                                    cursor: passengers === 4 ? 'not-allowed' : 'pointer',
                                    padding: '0', lineHeight: 1,
                                }}
                            >+</button>
                        </div>
                    </div>

                    {/* ── Expanded details — CSS max-height, NO layout animation ── */}
                    <div style={{
                        overflow: 'hidden',
                        maxHeight: isExpanded ? '300px' : '0px',
                        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '4px' }}>
                            {/* Info note */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: '#F9FAFB', padding: '11px 14px', borderRadius: '12px',
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
                                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                                    No ticket required for children below 5 years.
                                </div>
                            </div>

                            {/* Fare breakdown */}
                            <div style={{ border: '1px solid #F3F4F6', borderRadius: '14px', overflow: 'hidden' }}>
                                <div
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                    style={{
                                        padding: '13px 16px', borderBottom: '1px solid #F3F4F6',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Ticket Details</span>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>▲ collapse</span>
                                </div>
                                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                                        <span>Base fare × {passengers}</span>
                                        <span>₹{baseFare} × {passengers}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 700, color: '#111' }}>
                                        <span>Total</span>
                                        <span>₹{totalFare}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Inc. all taxes and charges</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment failure banner */}
                    {paymentStatus === 'failure' && (
                        <div style={{
                            marginBottom: '12px', marginTop: '8px', padding: '12px',
                            backgroundColor: '#FEF2F2', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '10px',
                        }}>
                            <AlertCircle size={16} color="#EF4444" />
                            <div style={{ fontSize: '13px', color: '#991B1B', fontWeight: 500 }}>
                                {t('ticket.payment_failed', 'Payment failed. Please try again.')}
                            </div>
                        </div>
                    )}

                    {/* ── CTA Button ── */}
                    {onProceedPayment && (
                        <div style={{ marginTop: isExpanded ? '20px' : '4px', transition: 'margin-top 0.3s ease' }}>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLoading && paymentStatus !== 'processing') {
                                        haptics.medium();
                                        onProceedPayment(totalFare);
                                    }
                                }}
                                disabled={!totalFare || isLoading || paymentStatus === 'processing'}
                                style={{
                                    width: '100%',
                                    height: '54px',
                                    borderRadius: '27px',
                                    border: 'none',
                                    backgroundColor: '#2563EB',
                                    color: '#FFFFFF',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    cursor: (totalFare && !isLoading) ? 'pointer' : 'not-allowed',
                                    opacity: (totalFare && !isLoading) ? 1 : 0.7,
                                    boxShadow: '0 4px 14px rgba(37,99,235,0.28)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    flexShrink: 0,
                                }}
                            >
                                {isLoading || paymentStatus === 'processing'
                                    ? t('ticket.processing_payment', 'Processing…')
                                    : paymentStatus === 'failure'
                                        ? t('ticket.retry_payment', 'Retry Payment')
                                        : `Book Bus @ ₹${totalFare || '--'}`
                                }
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default TicketScreen;
