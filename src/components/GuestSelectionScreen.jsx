import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Plus } from 'lucide-react';
import Lottie from 'lottie-react';
import guestAnimation from './LottieAnimations/Adding Guests Interaction.json'; // Verify path
import haptics from '../utils/haptics';

const lottieStyle = { width: '100%', height: '100%' };

const MemoizedLottie = React.memo(({ lottieRef }) => {
    return (
        <Lottie
            lottieRef={lottieRef}
            animationData={guestAnimation}
            loop={false}
            autoplay={false}
            initialSegment={[10, 10]} // Start at frame 10 (1 Ticket)
            style={lottieStyle}
            rendererSettings={{
                preserveAspectRatio: 'xMidYMid slice',
                clearCanvas: true
            }}
        />
    );
});

// Defined markers from the JSON file
const MARKERS = {
    1: 10,
    2: 60,
    3: 120,
    4: 180,
    5: 240,
    6: 300
};

const GuestSelectionScreen = ({
    isVisible,
    onClose,
    onContinue,
    routeData,
    selectedRoute
}) => {
    const [count, setCount] = useState(1);
    const [baseFare, setBaseFare] = useState(0);
    const lottieRef = React.useRef(null);

    // Initial Fare Logic
    useEffect(() => {
        if (isVisible && routeData) {
            const distanceStr = routeData.distance || '0 km';
            const distance = parseFloat(distanceStr.replace(/[^0-9.]/g, ''));

            let ratePerKm = 1.5;
            if (selectedRoute?.type === 'train') ratePerKm = 0.8;

            let calculatedBase = Math.round(distance * ratePerKm);
            if (calculatedBase < 10) calculatedBase = 10;

            setBaseFare(calculatedBase);
            setCount(1); // Reset
            // Reset animation to start
            if (lottieRef.current) {
                lottieRef.current.goToAndStop(MARKERS[1], true);
            }
        }
    }, [isVisible, routeData, selectedRoute]);

    if (!isVisible) return null;

    const totalFare = baseFare * count;

    const handleIncrement = () => {
        if (count < 6) {
            haptics.light();
            const startFrame = MARKERS[count];
            const endFrame = MARKERS[count + 1];
            lottieRef.current?.playSegments([startFrame, endFrame], true);
            setCount(c => c + 1);
        }
    };

    const handleDecrement = () => {
        if (count > 1) {
            haptics.light();
            const startFrame = MARKERS[count];
            const endFrame = MARKERS[count - 1];
            lottieRef.current?.playSegments([startFrame, endFrame], true);
            setCount(c => c - 1);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 6000,
            backgroundColor: 'white', display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={onClose} style={{ border: 'none', background: 'none' }}>
                    <X size={24} color="#111" />
                </button>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '-40px' }}>

                {/* 1. Prompt Text */}
                <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '20px', color: '#111' }}>
                    How many tickets?
                </h2>

                {/* 2. Interactive Animation (Counter) */}
                <div style={{ position: 'relative', width: 320, height: 320 }}>
                    <MemoizedLottie lottieRef={lottieRef} />

                    {/* Transparent Click Zones */}
                    {/* Decrement Zone (Left) */}
                    <div
                        onClick={handleDecrement}
                        style={{
                            position: 'absolute', top: '20%', left: 0, width: '40%', bottom: '20%',
                            cursor: 'pointer', zIndex: 10
                        }}
                    />
                    {/* Increment Zone (Right) */}
                    <div
                        onClick={handleIncrement}
                        style={{
                            position: 'absolute', top: '20%', right: 0, width: '40%', bottom: '20%',
                            cursor: 'pointer', zIndex: 10
                        }}
                    />
                </div>

                {/* 3. Total Amount */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Total Amount
                    </span>
                    <motion.div
                        key={totalFare}
                        initial={{ scale: 1.1, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{ fontSize: '36px', fontWeight: 600, color: '#111', marginTop: '4px' }}
                    >
                        ₹{totalFare}
                    </motion.div>
                </div>

            </div>

            {/* 4. Footer Button */}
            <div style={{ padding: '24px' }}>
                <button
                    onClick={() => onContinue(count, totalFare)}
                    style={{
                        width: '100%', padding: '18px', borderRadius: '24px',
                        backgroundColor: '#111', color: 'white',
                        fontSize: '16px', fontWeight: 600, border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default GuestSelectionScreen;
