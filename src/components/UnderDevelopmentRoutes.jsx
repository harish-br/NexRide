import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Lottie from 'lottie-react';
import programmingAnimation from './LottieAnimations/Programming Animation.json';
import haptics from '../utils/haptics';

const UnderDevelopmentRoutes = ({ onBack }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '20px 0',
        }}>
            {/* Animation Element */}
            <div style={{ width: '200px', height: '200px', marginBottom: '16px' }}>
                <Lottie
                    animationData={programmingAnimation}
                    loop={true}
                    autoplay={true}
                />
            </div>

            {/* Headline */}
            <h2 style={{
                fontSize: '22px',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '16px',
                lineHeight: 1.2
            }}>
                Route planning is under development
            </h2>

            {/* Description */}
            <div style={{
                fontSize: '15px',
                color: '#6B7280',
                lineHeight: '1.6',
                maxWidth: '320px',
                fontWeight: '500',
                margin: '0 auto'
            }}>
                We’re currently integrating real-time public transport data to deliver accurate walking directions, fares, timings, and multi-route options.
                <br /><br />
                This feature will be available soon.
            </div>
        </div>
    );
};

export default UnderDevelopmentRoutes;
