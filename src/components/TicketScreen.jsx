import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Clock, Bus, Train, CreditCard } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import busIconNew from '../assets/bus_option_new.png';
import haptics from '../utils/haptics';
import GlobalLoader from './GlobalLoader';

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
    const [fare, setFare] = useState(null);

    // Calculate fare when route data changes
    useEffect(() => {
        if (isVisible) {
            // Priority: Use passed override fare (total for all guests)
            if (overrideFare) {
                setFare(overrideFare);
                return;
            }

            // Fallback: Calculate for single passenger
            if (routeData) {
                // Extract distance number from string "16 km" -> 16
                const distanceStr = routeData.distance || '0 km';
                const distance = parseFloat(distanceStr.replace(/[^0-9.]/g, ''));

                // Basic Fare Logic (Modular)
                let ratePerKm = 1.5; // Default for Bus
                if (selectedRoute?.type === 'train') {
                    ratePerKm = 0.8; // Cheaper for Train
                }

                // Minimum fare logic
                let calculatedFare = Math.round(distance * ratePerKm);
                if (calculatedFare < 10) calculatedFare = 10; // Min fare ₹10

                setFare(calculatedFare);
            }
        }
    }, [isVisible, routeData, selectedRoute, overrideFare]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 5000,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pointerEvents: 'none' // Allow clicks to pass through to backdrop if we had one
            }}
        >
            {/* Backdrop Area (Clicking here closes) */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    pointerEvents: 'auto'
                }}
                onClick={() => {
                    haptics.light();
                    onClose();
                }}
            />

            {/* Ticket Card */}
            <div style={{
                width: '100%',
                maxWidth: '450px',
                backgroundColor: '#F3F4F6',
                borderTopLeftRadius: '32px',
                borderTopRightRadius: '32px',
                padding: '24px',
                paddingBottom: '40px',
                position: 'relative',
                pointerEvents: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
                minHeight: '600px', // Ensure height for animation
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* ANIMATION LAYER */}
                {/* CONTENT LAYER */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Drag Handle */}
                    <div style={{
                        width: '40px',
                        height: '5px',
                        backgroundColor: '#D1D5DB',
                        borderRadius: '10px',
                        margin: '0 auto 20px auto'
                    }} />

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111', margin: 0 }}>
                            Your Ticket
                        </h2>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                                haptics.light();
                                onClose();
                            }}
                            style={{
                                background: '#E5E7EB',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} color="#374151" />
                        </motion.button>
                    </div>

                    {/* TICKET VISUAL */}
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        marginBottom: '24px',
                        position: 'relative'
                    }}>
                        {/* Ticket Top: Route Info */}
                        <div style={{ padding: '24px', borderBottom: '2px dashed #E5E7EB' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From</div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginTop: '4px' }}>
                                        {routeData?.origin?.name?.split(',')[0] || 'Origin'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To</div>
                                    <div style={{ fontSize: '18px', fontWeight: 600, color: '#111', marginTop: '4px' }}>
                                        {(() => {
                                            const dest = routeData?.destination;
                                            if (!dest) return 'Destination';
                                            // If dest is a string (e.g. "Coimbatore"), use it directly
                                            if (typeof dest === 'string') return dest.split(',')[0];
                                            // If dest is an object (e.g. { name: "Coimbatore" }), use .name
                                            return dest.name?.split(',')[0] || 'Destination';
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {/* Transport Info */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                marginTop: '20px',
                                marginLeft: '-24px' // Flush with the left edge of the card
                            }}>
                                {selectedRoute?.type === 'bus' ? (
                                    <img
                                        src={busIconNew}
                                        alt="Bus"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'contain',
                                            display: 'block'
                                        }}
                                    />
                                ) : (
                                    <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                                        <Train size={56} color="#16A34A" />
                                    </div>
                                )}
                                <div>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 600,
                                        color: '#111',
                                        textTransform: 'capitalize',
                                        lineHeight: '1.1'
                                    }}>
                                        {selectedRoute?.type || 'Transport'}
                                    </div>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: '500',
                                        color: '#6B7280',
                                        marginTop: '4px'
                                    }}>
                                        {selectedRoute?.routeNumber || 'Route'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Bottom: Fare & ETA */}
                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <Clock size={16} color="#6B7280" />
                                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>ETA</span>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 600, color: '#111' }}>
                                    {routeData?.duration || '--'}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500', marginBottom: '4px' }}>Total Fare</div>
                                <div style={{ fontSize: '28px', fontWeight: 600, color: '#111' }}>
                                    ₹{fare || '--'}
                                </div>
                            </div>
                        </div>

                        {/* Decorative Cutouts for "Ticket" Look */}
                        <div style={{
                            position: 'absolute',
                            top: '50%', // Approximate position of dashed line
                            marginTop: '-42px', // Adjust based on top section height
                            left: '-12px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '50%'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            marginTop: '-42px',
                            right: '-12px',
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '50%'
                        }} />
                    </div>

                    {/* Payment Failure Message */}
                    {paymentStatus === 'failure' && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            backgroundColor: '#FEF2F2',
                            borderRadius: '16px',
                            border: '1px solid #FECACA',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <AlertCircle size={20} color="#EF4444" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B' }}>Payment Failed</div>
                                <div style={{ fontSize: '12px', color: '#B91C1C' }}>Please try again.</div>
                            </div>
                        </div>
                    )}

                    {/* Payment Button - Only show if onProceedPayment is provided */}
                    {onProceedPayment && (
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                                if (!isLoading && paymentStatus !== 'processing') {
                                    haptics.medium();
                                    onProceedPayment(fare);
                                }
                            }}
                            disabled={!fare || isLoading || paymentStatus === 'processing'}
                            style={{
                                width: '100%',
                                backgroundColor: paymentStatus === 'failure' ? '#DC2626' : '#111',
                                color: '#fff',
                                border: 'none',
                                padding: '18px',
                                borderRadius: '20px',
                                fontSize: '16px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: (fare && !isLoading) ? 'pointer' : 'not-allowed',
                                opacity: (fare && !isLoading) ? 1 : 0.7,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease',
                                marginTop: '16px'
                            }}
                        >
                            {!isLoading && <CreditCard size={20} color="#fff" />}
                            {isLoading || paymentStatus === 'processing' ? 'Processing Payment...' : (paymentStatus === 'failure' ? 'Retry Payment' : 'Proceed to Payment')}
                        </motion.button>
                    )}

                </div> {/* End Content Layer */}

            </div>
        </motion.div >
    );
};

export default TicketScreen;
