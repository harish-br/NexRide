import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';

// Shared Layout for Auth Screens
const AuthLayout = ({ children, title, subtitle }) => (
    <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#2563eb', // Blue 600 - Match reference blue
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end', // Align content to bottom
        zIndex: 5000
    }}>
        {/* Back Arrow - Assuming it should be visible on the blue background */}
        <div style={{ padding: '16px', color: 'white' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
        </div>

        <div style={{ flex: 1 }}></div>

        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            style={{
                backgroundColor: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '32px 24px',
                paddingBottom: '48px', // Extra padding at bottom
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#111827',
                    marginBottom: '8px',
                    letterSpacing: '-0.5px'
                }}>
                    {title}
                </h1>
                <p style={{
                    fontSize: '15px',
                    color: '#6B7280',
                    lineHeight: '1.5'
                }}>
                    {subtitle}
                </p>
            </div>
            {children}
        </motion.div>
    </div>
);

export const PhoneInputScreen = ({ onOtpSent, onError }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaWrapperRef = useRef(null);

    // Initialize Invisible Recaptcha on Mount
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => {
                        // reCAPTCHA solved, allow signInWithPhoneNumber.
                        // handled automatically by firebase
                    },
                    'expired-callback': () => {
                        onError("Recaptcha expired. Please try again.");
                    }
                });
            } catch (err) {
                // Captcha might already be initialized preventing re-init error
                console.warn("Recaptcha Init Warn:", err);
            }
        }
    }, [onError]);

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            onError("Please enter a valid 10-digit number.");
            return;
        }

        setLoading(true);
        const fullNumber = `+91${phoneNumber}`;

        try {
            const appVerifier = window.recaptchaVerifier;
            const confirmationResult = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
            window.confirmationResult = confirmationResult; // Store globally or lift state
            onOtpSent(confirmationResult);
        } catch (error) {
            console.error("OTP Error:", error);
            if (error.code === 'auth/invalid-phone-number') {
                onError("The phone number is invalid.");
            } else if (error.code === 'auth/too-many-requests') {
                onError("Too many attempts. Please try again later.");
            } else {
                onError("Failed to send OTP. Try again.");
            }
            // Reset captcha if needed
            if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(widgetId => window.grecaptcha.reset(widgetId));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="What's your number?"
            subtitle="We'll send you a verification code to secure your account."
        >
            {/* Invisible Recaptcha Container */}
            <div id="recaptcha-container" ref={recaptchaWrapperRef}></div>

            <div style={{ flex: 1 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF', // White
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '24px',
                    border: '1px solid #E5E7EB', // Gray 200 border
                    transition: 'border-color 0.2s',
                }}>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: '#374151',
                        marginRight: '12px',
                        paddingRight: '12px',
                        borderRight: '1px solid #D1D5DB'
                    }}>
                        +91
                    </span>
                    <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, ''); // Only numbers
                            if (val.length <= 10) setPhoneNumber(val);
                        }}
                        placeholder="Mobile Number"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            fontSize: '18px',
                            fontWeight: '800',
                            color: '#374151',
                            outline: 'none',
                            caretColor: '#111827'
                        }}
                        autoFocus
                    />
                </div>
            </div>

            <button
                onClick={handleSendOtp}
                disabled={phoneNumber.length < 10 || loading}
                style={{
                    width: '100%',
                    padding: '18px',
                    backgroundColor: phoneNumber.length === 10 ? '#1569fd' : '#E5E7EB',
                    color: phoneNumber.length === 10 ? '#ffffff' : '#9CA3AF',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: phoneNumber.length === 10 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {loading ? (
                    <>
                        Continue
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                marginLeft: '10px'
                            }}
                        />
                    </>
                ) : 'Continue'}
            </button>
        </AuthLayout>
    );
};

export const OtpVerificationScreen = ({ confirmationResult, onSuccess, onError }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setLoading(true);

        try {
            const result = await confirmationResult.confirm(otp);
            // User signed in successfully.
            onSuccess(result.user);
        } catch (error) {
            console.error("OTP Verify Error:", error);
            if (error.code === 'auth/invalid-verification-code') {
                onError("Incorrect OTP. Please check and try again.");
            } else {
                onError("Verification failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Verify your mobile number"
            subtitle="Enter the 6-digit code sent to your number."
        >
            <div style={{ flex: 1 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '24px'
                }}>
                    <input
                        type="text" // 'tel' sometimes triggers numpad without copy/paste ease
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={otp}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 6) setOtp(val);
                        }}
                        placeholder="Enter 6-digit OTP"
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#111827',
                            outline: 'none',
                            textAlign: 'center',
                            letterSpacing: '8px'
                        }}
                        autoFocus
                    />
                </div>
            </div>

            <button
                onClick={handleVerifyOtp}
                disabled={otp.length < 6 || loading}
                style={{
                    width: '100%',
                    padding: '18px',
                    backgroundColor: otp.length === 6 ? '#1569fd' : '#E5E7EB',
                    color: otp.length === 6 ? '#ffffff' : '#9CA3AF',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {loading ? (
                    <>
                        Verify & Login
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{
                                width: '20px',
                                height: '20px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                marginLeft: '10px'
                            }}
                        />
                    </>
                ) : 'Verify & Login'}
            </button>

        </AuthLayout>
    );
};
