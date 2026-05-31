import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber, signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { X, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import haptics from '../utils/haptics';

const AuthSheet = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation();
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
                } catch {
                    console.warn("Recaptcha clear failed");
                }
                window.recaptchaVerifier = null;
            }

            try {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
                    'size': 'invisible',
                    'callback': () => {
                        console.log("Recaptcha Solved");
                    },
                    'expired-callback': () => {
                        setError(t('auth_sheet.recaptcha_expired'));
                    }
                });
            } catch (err) {
                console.warn("Recaptcha Init Warn:", err);
            }
        }
    }, [isOpen, t]);

    const handleSendOtp = async () => {
        if (phoneNumber.length !== 10) {
            setError(t('auth_sheet.valid_number_required'));
            return;
        }

        setLoading(true);
        setError(null);
        const fullNumber = `+91${phoneNumber}`;

        try {
            if (!window.recaptchaVerifier) {
                throw new Error(t('auth_sheet.recaptcha_init_error'));
            }
            const appVerifier = window.recaptchaVerifier;
            const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err) {
            console.error("OTP Error Full:", err);
            if (err.code === 'auth/invalid-phone-number') {
                setError(t('auth_sheet.invalid_number'));
            } else if (err.code === 'auth/too-many-requests') {
                setError(t('auth_sheet.too_many_attempts'));
            } else if (err.code === 'auth/captcha-check-failed') {
                setError(t('auth_sheet.captcha_failed'));
            } else {
                setError(`${t('auth_sheet.failed_send_otp')} ${err.message}`);
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

                localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
                localStorage.setItem('isLoggedIn', 'true');
            haptics.success();
            // Default to 'user' mode
            localStorage.setItem('appMode', 'user');
            onSuccess(user);
        } catch (err) {
            console.error("Verify Error:", err);
            haptics.error();
            setError(t('auth_sheet.incorrect_otp'));
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

                    localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
                localStorage.setItem('isLoggedIn', 'true');
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
                setError(t('auth_sheet.dev_session_failed'));
            } finally {
                setLoading(false);
            }
        } else {
            haptics.error();
            setError(t('auth_sheet.invalid_dev_code'));
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
            <div
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
                        <div key="phone">
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                {t('auth_sheet.title_moving')}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ fontSize: '15px', color: '#000000', marginBottom: '24px' }}>
                                {t('auth_sheet.subtitle_code')}
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
                                    onPointerDown={(e) => { setTimeout(() => e.target.focus(), 50); }}
                                    value={phoneNumber}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 10) setPhoneNumber(val);
                                    }}
                                    placeholder={t('auth_sheet.mobile_number')}
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
                                {t('auth_sheet.continue')}
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
                                    {t('auth_sheet.agree_terms')} <a href="https://docs.google.com/document/d/11kPVyAsOHKo9TgJ1D0y2Mly6g_tegDOKWWMqtZ5C6uU/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{t('auth_sheet.tnc')}</a>
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
                                        {t('auth_sheet.dev_access')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'otp' && (
                        <div key="otp">
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                {t('auth_sheet.verify_mobile_title')}
                            </h2>
                            <p style={{ fontSize: '15px', color: '#000000', marginBottom: '24px' }}>
                                {t('auth_sheet.enter_code_sent', { number: phoneNumber })}
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
                                        onPointerDown={(e) => { setTimeout(() => e.target.focus(), 50); }}
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
                                {t('auth_sheet.verify_continue')}
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
                                    {resendTimer > 0 ? t('auth_sheet.resend_in', { time: resendTimer }) : t('auth_sheet.resend_code')}
                                </button>
                            </div>
                        </div>
                    )}



                    {step === 'dev' && (
                        <div key="dev">
                            <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                {t('auth_sheet.dev_access')}
                            </h2>
                            <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '24px' }}>
                                {t('auth_sheet.enter_auth_code')}
                            </p>

                            <div style={{ backgroundColor: '#F3F4F6', borderRadius: '16px', padding: '16px', marginBottom: '24px' }}>
                                <input
                                    type="password"
                                    onPointerDown={(e) => { setTimeout(() => e.target.focus(), 50); }}
                                    value={devCode}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val.length <= 4) setDevCode(val);
                                    }}
                                    placeholder={t('auth_sheet.auth_code')}
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
                                {t('auth_sheet.verify_access')}
                            </button>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthSheet;
