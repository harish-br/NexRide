import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { X, ChevronLeft } from 'lucide-react';
import haptics from '../utils/haptics';

const AuthSheet = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState('phone'); // phone, otp, driver-code, mode-selection
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [devCode, setDevCode] = useState('');
    const [resendTimer, setResendTimer] = useState(30); // 30s timer
    const inputRefs = useRef([]);

    const [loading, setLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState(null);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setStep('phone');
            setPhoneNumber('');
            setOtp('');
            setDevCode('');
            setResendTimer(30);

            setError(null);
            setLoading(false);

        }
    }, [isOpen]);

    // Resend Timer Logic
    useEffect(() => {
        let interval;
        if (step === 'otp' && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer]);

    // Initialize Recaptcha (Global DOM Strategy)
    useEffect(() => {
        if (isOpen) {
            const containerId = 'recaptcha-cont-global';
            let container = document.getElementById(containerId);

            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                // styled to be invisible but present
                Object.assign(container.style, {
                    position: 'fixed',
                    bottom: '0',
                    left: '0',
                    zIndex: '1000',
                    pointerEvents: 'none',
                    opacity: '0' // Invisible
                });
                document.body.appendChild(container);
            }

            // Cleanup old verifier if exists (paranoid check)
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) { }
                window.recaptchaVerifier = null;
            }

            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
                    'size': 'invisible',
                    'callback': (response) => {
                        console.log("Recaptcha Solved");
                    },
                    'expired-callback': () => {
                        setError("Recaptcha expired. Please try again.");
                    }
                });
            } catch (err) {
                console.warn("Recaptcha Init Warn:", err);
            }
        }
    }, [isOpen]);

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            setError("Please enter a valid 10-digit number.");
            return;
        }

        setLoading(true);
        setError(null);
        const fullNumber = `+91${phoneNumber}`;

        try {
            if (!window.recaptchaVerifier) {
                throw new Error("Recaptcha not initialized. Re-opening sheet might help.");
            }
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err) {
            console.error("OTP Error Full:", err);
            if (err.code === 'auth/invalid-phone-number') {
                setError("Invalid phone number.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Too many attempts. Try again later.");
            } else if (err.code === 'auth/captcha-check-failed') {
                setError("Captcha failed. Please try again.");
            } else {
                setError(`Failed to send OTP. ${err.message}`);
            }

            // Reset captcha if needed
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.render().then(widgetId => window.grecaptcha.reset(widgetId));
                } catch (e) { console.warn("Captcha Reset Fail", e) }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) return;
        setLoading(true);
        setError(null);

        try {
            const result = await confirmationResult.confirm(otp);
            const user = result.user;

            haptics.success();
            // Default to 'user' mode
            localStorage.setItem('appMode', 'user');
            onSuccess(user);
        } catch (err) {
            console.error("Verify Error:", err);
            haptics.error();
            setError("Incorrect OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };



    const handleVerifyDevCode = async () => {
        if (devCode === '3112') {
            setLoading(true);
            setError(null);
            try {
                const result = await signInAnonymously(auth);
                const user = result.user;

                haptics.success();
                // Flag as developer by attaching property directly to the object 
                // to preserve getters/prototype chain (Crucial for uid availability)
                // or explicitly copy the necessary fields.
                const enhancedUser = {
                    ...JSON.parse(JSON.stringify(user)), // basic serialized props
                    uid: user.uid, // Explicitly ensure UID is copied
                    email: user.email || 'dev@nexride.in',
                    isDeveloper: true,
                    displayName: 'Developer'
                };

                localStorage.setItem('appMode', 'user');
                onSuccess(enhancedUser);
            } catch (err) {
                console.error("Dev Auth Error:", err);
                setError("Failed to create anonymous session.");
            } finally {
                setLoading(false);
            }
        } else {
            haptics.error();
            setError("Invalid Developer Code");
        }
    };

    const handleBack = () => {
        if (step === 'otp') setStep('phone');
        if (step === 'dev') setStep('phone');
    }




    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
        }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(2px)'
                }}
            />

            {/* Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    backgroundColor: '#ffffff',
                    borderTopLeftRadius: '24px',
                    borderTopRightRadius: '24px',
                    padding: '24px',
                    paddingBottom: '40px',
                    position: 'relative',
                    zIndex: 100000,
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)'
                }}
            >
                {/* Drag Handle */}
                <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', margin: '0 auto 16px auto' }} />

                {/* Header Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', height: '28px', minHeight: '28px' }}>
                    {step !== 'phone' ? (
                        <button onClick={handleBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                            <ChevronLeft size={24} color="#1F2937" />
                        </button>
                    ) : <div />}

                    {/* Close Button if explicitly needed, though backdrop click works. Keeping minimal. */}
                    {/* <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 0 }}>
                        <X size={24} color="#9CA3AF" />
                    </button> */}
                </div>

                {/* Content */}
                <AnimatePresence mode='wait'>
                    {step === 'phone' && (
                        <motion.div
                            key="phone"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                {'Let’s get you moving'}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ fontSize: '15px', color: '#000000', marginBottom: '24px' }}>
                                We’ll send a one-time code to get you started
                            </motion.p>

                            {/* Recaptcha was here */}

                            <div style={{
                                display: 'flex', alignItems: 'center', backgroundColor: '#FFFFFF',
                                borderRadius: '16px', padding: '16px', marginBottom: '24px',
                                border: '1px solid #E5E7EB'
                            }}>
                                <span style={{ fontWeight: '800', fontSize: '18px', marginRight: '12px', paddingRight: '12px', borderRight: '1px solid #D1D5DB', color: '#374151' }}>+91</span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPhoneNumber(val);
                                    }}
                                    placeholder="Mobile Number"
                                    autoFocus
                                    style={{
                                        flex: 1, background: 'transparent', border: 'none',
                                        fontSize: '18px', fontWeight: '800', outline: 'none',
                                        color: '#374151'
                                    }}
                                />
                            </div>

                            {error && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                            <button
                                onClick={handleSendOtp}
                                disabled={phoneNumber.length < 10 || loading}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                    backgroundColor: phoneNumber.length === 10 ? '#1569fd' : '#E5E7EB',
                                    color: phoneNumber.length === 10 ? '#ffffff' : '#9CA3AF',
                                    fontWeight: '600', fontSize: '16px', cursor: phoneNumber.length === 10 ? 'pointer' : 'not-allowed',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                Continue
                                {loading && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%'
                                        }}
                                    />
                                )}
                            </button>

                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <p style={{ fontSize: '13px', color: '#000000', marginBottom: '8px' }}>
                                    By clicking continue you agree to our <a href="https://docs.google.com/document/d/11kPVyAsOHKo9TgJ1D0y2Mly6g_tegDOKWWMqtZ5C6uU/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>T&C's</a>
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                                    <button
                                        onClick={() => setStep('dev')}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            fontSize: '11px', color: '#E5E7EB',
                                            cursor: 'pointer', padding: '4px'
                                        }}
                                    >
                                        Developer Access
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'otp' && (
                        <motion.div
                            key="otp"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                Verify your mobile number
                            </h2>
                            <p style={{ fontSize: '15px', color: '#000000', marginBottom: '24px' }}>
                                Enter code sent to +91 {phoneNumber}
                            </p>

                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center',
                                marginBottom: '32px'
                            }}>
                                {[...Array(6)].map((_, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otp[index] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!/^\d*$/.test(val)) return;

                                            const newOtp = otp.split('');
                                            newOtp[index] = val;
                                            const newOtpStr = newOtp.join('');
                                            setOtp(newOtpStr);

                                            // Auto-advance
                                            if (val && index < 5) {
                                                inputRefs.current[index + 1].focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace') {
                                                if (!otp[index] && index > 0) {
                                                    // Move back if empty
                                                    inputRefs.current[index - 1].focus();
                                                }
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                            if (pasted) {
                                                setOtp(pasted);
                                                // Focus the last filled input or the next empty one
                                                const nextIndex = Math.min(pasted.length, 5);
                                                inputRefs.current[nextIndex].focus();
                                            }
                                        }}
                                        style={{
                                            width: '48px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            border: '1px solid #E5E7EB',
                                            backgroundColor: '#F9FAFB',
                                            fontSize: '24px',
                                            fontWeight: '700',
                                            textAlign: 'center',
                                            color: '#111827',
                                            outline: 'none',
                                            transition: 'all 0.2s',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#111827';
                                            e.target.style.backgroundColor = '#FFFFFF';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#E5E7EB';
                                            e.target.style.backgroundColor = '#F9FAFB';
                                        }}
                                    />
                                ))}
                            </div>

                            {error && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                            <button
                                onClick={handleVerifyOtp}
                                disabled={otp.length < 6 || loading}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                    backgroundColor: otp.length === 6 ? '#1569fd' : '#E5E7EB',
                                    color: otp.length === 6 ? '#ffffff' : '#9CA3AF',
                                    fontWeight: '600', fontSize: '16px', cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                                    marginBottom: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                Verify & Continue
                                {loading && (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            border: '2px solid rgba(255,255,255,0.3)',
                                            borderTopColor: '#fff',
                                            borderRadius: '50%'
                                        }}
                                    />
                                )}
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                <button
                                    onClick={() => {
                                        setResendTimer(30);
                                        handleSendOtp();
                                    }}
                                    disabled={resendTimer > 0 || loading}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: resendTimer > 0 ? '#9CA3AF' : '#2563eb',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
                                </button>
                            </div>
                        </motion.div>
                    )}



                    {step === 'dev' && (
                        <motion.div
                            key="dev"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                Developer Access
                            </h2>
                            <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '24px' }}>
                                Enter authorization code
                            </p>

                            <div style={{ backgroundColor: '#F3F4F6', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                <input
                                    type="password"
                                    value={devCode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setDevCode(val);
                                    }}
                                    placeholder="Auth Code"
                                    autoFocus
                                    style={{
                                        width: '100%', background: 'transparent', border: 'none',
                                        fontSize: '18px', fontWeight: '600', outline: 'none', textAlign: 'center'
                                    }}
                                />
                            </div>

                            {error && <p style={{ color: '#EF4444', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}

                            <button
                                onClick={handleVerifyDevCode}
                                disabled={devCode.length < 4}
                                style={{
                                    width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
                                    backgroundColor: devCode.length >= 4 ? '#111827' : '#E5E7EB',
                                    color: devCode.length >= 4 ? '#ffffff' : '#9CA3AF',
                                    fontWeight: '600', fontSize: '16px', cursor: devCode.length >= 4 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Verify Access
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default AuthSheet;
