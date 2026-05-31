import React, { useState, useEffect } from 'react';
import { auth, googleProvider, githubProvider } from '../firebase';
import {
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { Github, Loader2, Code2, Mail, User, ArrowLeft, Eye, EyeOff, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useTranslation } from 'react-i18next';
import googleIconData from '../assets/google-icon.json';
import githubIconData from '../assets/github-icon.json';
import guestIconData from '../assets/guest-icon.json';
import haptics from '../utils/haptics';

const LoginScreen = ({ onBack, zIndex = 40, isEmbedded = false, onSuccess }) => {
    const { t } = useTranslation();
    const [authError, setAuthError] = useState(null);
    const googleLottieRef = React.useRef(null);
    const githubLottieRef = React.useRef(null);
    const guestLottieRef = React.useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Track network state manually inside login screen
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Interval for Animations (every 3 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            if (googleLottieRef.current) googleLottieRef.current.goToAndPlay(0);
            if (githubLottieRef.current) githubLottieRef.current.goToAndPlay(0);
            if (guestLottieRef.current) guestLottieRef.current.goToAndPlay(0);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleEmailAuth = async (e) => {
        haptics.light();
        e.preventDefault();
        if (isLoading || !email || !password) return;

        setAuthError(null);
        setIsLoading(true);

        try {
            await setPersistence(auth, browserLocalPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
            localStorage.setItem('isLoggedIn', 'true');
            haptics.success();
            if (onSuccess) {
                onSuccess();
            } else if (onBack) {
                onBack(); // SUCCESS: Navigate back
            }
        } catch (error) {
            console.error("Email auth error", error);
            let msg = error.message;
            if (error.code === 'auth/invalid-credential') msg = t('login.invalid_credentials');
            if (error.code === 'auth/email-already-in-use') msg = t('login.email_exists');
            if (error.code === 'auth/weak-password') msg = t('login.weak_password');
            setAuthError(msg);
            haptics.error();
            setIsLoading(false);
        }
    };

    const handleSocialSignIn = async (provider) => {
        if (isLoading) return;
        setAuthError(null);
        setIsLoading(true);

        try {
            await setPersistence(auth, browserLocalPersistence);
            const result = await signInWithPopup(auth, provider);
            console.log("Social Login Success:", result.user);
            localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
            localStorage.setItem('isLoggedIn', 'true');
            haptics.success();
            if (onSuccess) {
                onSuccess();
            } else if (onBack) {
                onBack(); // SUCCESS: Navigate back
            }
        } catch (error) {
            console.error("Social login error", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setAuthError(t('login.signin_cancelled'));
            } else {
                setAuthError(t('login.login_failed'));
            }
            haptics.error();
            setIsLoading(false);
        }
    };

    const handleGuestSignIn = async () => {
        if (isLoading) return;
        setAuthError(null);
        setIsLoading(true);

        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInAnonymously(auth);
            localStorage.setItem('userSession', JSON.stringify({ isLoggedIn: true, sessionStatus: 'active', lastLoginAt: Date.now() }));
            localStorage.setItem('isLoggedIn', 'true');
            haptics.success();
            if (onSuccess) {
                onSuccess();
            } else if (onBack) {
                onBack(); // SUCCESS: Navigate back
            }
        } catch (error) {
            console.error("Guest login error", error);
            setAuthError(error.message);
            haptics.error();
            setIsLoading(false);
        }
    };

    // Adapting the wrapper style based on isEmbedded
    const containerStyle = isEmbedded ? {
        position: 'relative',
        height: '100%',
        width: '100%',
        zIndex: 0,
        backgroundColor: '#000',
        overflow: 'hidden' // Ensure it stays contained
    } : {
        position: 'absolute', inset: 0,
        zIndex: zIndex,
        backgroundColor: '#000',
    };

    return (
        <div style={containerStyle}>
            {/* --- 1. HERO BACKGROUND SECTION (Top 60%) --- */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '65%', // Covers top 65%
                backgroundImage: 'url(/login_bg_new.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
                {/* Back Button - Show if onBack exists (works for both embedded `isEmbedded=true` and full modal) */}
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute', top: '20px', left: '20px',
                            background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)',
                            border: 'none', borderRadius: '50%',
                            width: '40px', height: '40px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 50
                        }}
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </button>
                )}

                {/* Hero Text */}
                <div style={{
                    position: 'absolute', top: '40%', left: 0, right: 0,
                    padding: '0 32px', textAlign: 'center', zIndex: 10,
                    transform: 'translateY(-50%)'
                }}>
                    <h1 style={{
                        fontSize: '48px', fontWeight: 600, color: '#fff',
                        margin: '0 0 8px 0', letterSpacing: '-1px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        display: 'flex', justifyContent: 'center', alignItems: 'flex-end'
                    }}>
                        NexRide
                        <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{ color: '#fff' }}
                        >
                            .
                        </motion.span>
                    </h1>


                </div>
            </div>

            {/* --- 2. BOTTOM HOVER CARD (Bottom 40-50%) --- */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: '#fff',
                borderTop: '1px solid rgba(255, 255, 255, 0.8)',
                borderRadius: '32px 32px 0 0',
                padding: '32px 24px',
                paddingBottom: '10px', // For BottomNav
                display: 'flex', flexDirection: 'column',
                height: 'auto', maxHeight: '70%',
                overflowY: 'auto',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.1)' // Soft shadow return
            }}>
                
                {isOffline && (
                    <div style={{
                        position: 'absolute', inset: 0, zIndex: 100,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '12px',
                        borderTopLeftRadius: '32px', borderTopRightRadius: '32px'
                    }}>
                        <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '50%' }}>
                            <WifiOff size={32} color="#EF4444" />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>You are Offline</h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', textAlign: 'center', maxWidth: '240px' }}>
                            No internet connection. Please connect to continue.
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {authError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            marginBottom: '20px', padding: '12px',
                            backgroundColor: '#FEF2F2', color: '#DC2626',
                            fontSize: '13px', borderRadius: '12px', fontWeight: '500',
                            textAlign: 'center', border: '1px solid #FECACA'
                        }}>
                        {authError}
                    </motion.div>
                )}

                {/* --- A) LOGIN FORM --- */}
                <form onSubmit={handleEmailAuth} style={{ marginBottom: '24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="email"
                            placeholder={t('login.email_placeholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('login.password_placeholder')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            style={{ paddingRight: '48px' }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => {
                                haptics.light();
                                setShowPassword(!showPassword);
                            }}
                            style={{
                                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
                                padding: '4px'
                            }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '16px',
                            backgroundColor: '#1569fd', color: '#fff',
                            border: 'none', fontSize: '16px', fontWeight: '600',
                            cursor: isLoading ? 'wait' : 'pointer',
                            opacity: isLoading ? 0.8 : 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? t('login.create_account') : t('login.login_button'))}
                    </motion.button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <span
                            onClick={() => {
                                haptics.light();
                                setIsSignUp(!isSignUp)
                            }}
                            style={{ fontSize: '14px', color: '#2563EB', fontWeight: '600', cursor: 'pointer' }}
                        >
                            {isSignUp ? t('login.already_have_account') : t('login.new_create_account')}
                        </span>
                    </div>
                </form>

                {/* --- B) SOCIAL & GUEST --- */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '32px' }}>
                    <SocialButton
                        onClick={() => handleSocialSignIn(googleProvider)}
                        isLottie={true}
                        icon={
                            <Lottie
                                lottieRef={googleLottieRef}
                                animationData={googleIconData}
                                loop={false}
                                autoplay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        }
                        label="Google"
                    />
                    <SocialButton
                        onClick={() => handleSocialSignIn(githubProvider)}
                        isLottie={true}
                        icon={
                            <Lottie
                                lottieRef={githubLottieRef}
                                animationData={githubIconData}
                                loop={false}
                                autoplay={true}
                                style={{ width: '100%', height: '100%' }}
                            />
                        }
                        label="GitHub"
                    />
                    <SocialButton
                        onClick={handleGuestSignIn}
                        isLottie={true}
                        icon={
                            <Lottie
                                lottieRef={guestLottieRef}
                                animationData={guestIconData}
                                loop={false}
                                autoplay={true} // Play once on mount, then interval takes over
                                style={{ width: '100%', height: '100%' }}
                            />
                        }
                        label="Guest"
                    />
                </div>

                {/* --- C) LEGAL LINKS --- */}
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>
                        {t('login.by_continuing')}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
                        <a href="https://docs.google.com/document/d/11kPVyAsOHKo9TgJ1D0y2Mly6g_tegDOKWWMqtZ5C6uU/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer" style={{ color: '#374151', textDecoration: 'underline' }}>Terms</a>
                        <span style={{ color: '#D1D5DB' }}>•</span>
                        <a href="/privacy-policy" style={{ color: '#374151', textDecoration: 'underline' }}>Privacy</a>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }
                
                .login-input {
                    width: 100%;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid #E5E7EB;
                    outline: none;
                    font-size: 15px;
                    background-color: rgba(249, 250, 251, 0.5);
                    color: #111;
                    transition: all 0.2s ease;
                }
                .login-input:focus {
                    border-color: #2563EB;
                    background-color: #fff;
                    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
                .login-input::placeholder {
                    color: #9CA3AF;
                }
            `}</style>
        </div>
    );
};

// Helper Component for Social Icons
const SocialButton = ({ onClick, icon, label, isLottie = false, onMouseEnter, onMouseLeave }) => (
    <motion.button
        type="button"
        whileHover={{ scale: 1.02, y: -2, backgroundColor: '#fff' }}
        whileTap={{ scale: 0.96 }}
        onClick={(e) => {
            haptics.light();
            onClick(e);
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '12px', borderRadius: '16px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer', gap: '6px'
        }}
    >
        <div style={{
            color: '#1F2937',
            width: isLottie ? '48px' : '24px',
            height: isLottie ? '48px' : '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {isLottie ? (
                <div style={{ width: '100%', height: '100%' }}>
                    {icon}
                </div>
            ) : icon}
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#4B5563' }}>{label}</span>
    </motion.button>
);

export default LoginScreen;
