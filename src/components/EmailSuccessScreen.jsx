import React, { useEffect } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import emailAnimation from './LottieAnimations/Email.json'; // Ensure file exists

const EmailSuccessScreen = ({ onComplete }) => {

    useEffect(() => {
        // Fallback: If animation doesn't finish or triggers, force complete after 2.5s
        const timer = setTimeout(() => {
            onComplete && onComplete();
        }, 2200);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: '#FFFFFF',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}
        >
            <div style={{ width: 180, height: 180 }}>
                <Lottie
                    animationData={emailAnimation}
                    loop={false}
                    autoplay={true}
                    onComplete={() => {
                        // Optional: trigger faster if animation is shorter than timeout
                        // But timeout is safe for consistency.
                    }}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                style={{
                    marginTop: '24px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827'
                }}
            >
                Welcome!
            </motion.p>
        </motion.div>
    );
};

export default EmailSuccessScreen;
