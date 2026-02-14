import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider, githubProvider } from '../firebase';
import {
    signInWithPopup,
    setPersistence,
    browserLocalPersistence,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import googleIconData from '../assets/google-icon.json';
import githubIconData from '../assets/github-icon.json';
import guestIconData from '../assets/guest-icon.json';
import haptics from '../utils/haptics';

// Helper Component for Social Icons
const SocialButton = ({ onClick, icon, label, isLottie = false, lottieRef, onMouseEnter, onMouseLeave }) => (
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

const LoginForm = ({ onSuccess }) => {
    const [authError, setAuthError] = useState(null);
    const googleLottieRef = useRef(null);
    const githubLottieRef = useRef(null);
    const guestLottieRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Interval for Animations
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
            // Force persistence to LOCAL
            await setPersistence(auth, browserLocalPersistence);
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                haptics.success();
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                haptics.success();
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Email auth error", error);
            let msg = error.message;
            if (error.code === 'auth/invalid-credential') msg = "Invalid email or password.";
            if (error.code === 'auth/email-already-in-use') msg = "Email exists. Try signing in.";
            if (error.code === 'auth/weak-password') msg = "Password too short (min 6 chars).";
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
            haptics.success();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Social login error", error);
            if (error.code === 'auth/popup-closed-by-user') {
                setAuthError("Sign-in cancelled.");
            } else {
                setAuthError("Login failed. Please try again.");
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
            haptics.success();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Guest login error", error);
            setAuthError(error.message);
            haptics.error();
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: '100%' }}>
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
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                        required
                    />
                </div>
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
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
                            setShowPassword(!showPassword)
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
                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : (isSignUp ? "Create Account" : "Login")}
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span
                        onClick={() => {
                            haptics.light();
                            setIsSignUp(!isSignUp)
                        }}
                        style={{ fontSize: '14px', color: '#2563EB', fontWeight: '600', cursor: 'pointer' }}
                    >
                        {isSignUp ? "Already have an account? Login" : "New? Create an account"}
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
                {/* Guest access included as requested */}
                <SocialButton
                    onClick={handleGuestSignIn}
                    isLottie={true}
                    icon={
                        <Lottie
                            lottieRef={guestLottieRef}
                            animationData={guestIconData}
                            loop={false}
                            autoplay={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    }
                    label="Guest"
                />
            </div>

            {/* --- C) LEGAL LINKS --- */}
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 4px 0' }}>
                    By continuing, you agree to our
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', fontSize: '12px', fontWeight: '500' }}>
                    <a href="https://docs.google.com/document/d/11kPVyAsOHKo9TgJ1D0y2Mly6g_tegDOKWWMqtZ5C6uU/edit?usp=drivesdk" target="_blank" rel="noopener noreferrer" style={{ color: '#374151', textDecoration: 'underline' }}>Terms</a>
                    <span style={{ color: '#D1D5DB' }}>•</span>
                    <a href="/privacy-policy" style={{ color: '#374151', textDecoration: 'underline' }}>Privacy</a>
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

export default LoginForm;
