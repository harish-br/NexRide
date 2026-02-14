import React from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import successAnimation from './LottieAnimations/success.json';

const SuccessAnimationScreen = ({ onComplete }) => {
    const { t } = useTranslation();
    // strict 2-second timer to ensure user sees the success message
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 5000,
                background: '#ffffff', // Clean white background
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column', // Stack vertically
                pointerEvents: 'auto',
            }}
        >
            <div style={{ width: '200px', height: '200px', marginBottom: '20px' }}>
                <Lottie
                    animationData={successAnimation}
                    loop={false}
                    autoPlay={true}
                />
            </div>

            <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#111',
                    marginBottom: '8px',
                    textAlign: 'center',
                }}
            >
                {t('payment.success_title', 'Payment Successful')}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    textAlign: 'center',
                    fontWeight: '500'
                }}
            >
                {t('payment.generating_ticket', 'Your ticket is being generated...')}
            </motion.p>
        </motion.div>
    );
};

export default SuccessAnimationScreen;
