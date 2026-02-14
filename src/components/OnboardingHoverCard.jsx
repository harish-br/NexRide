import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import haptics from '../utils/haptics';

const OnboardingHoverCard = ({ onComplete, onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        dob: ''
    });

    const [status, setStatus] = useState({
        isLoading: false,
        error: '',
        touched: {
            name: false,
            email: false,
            dob: false
        }
    });

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const errors = {
        name: formData.name.trim().length < 3 ? "Name must be at least 3 characters" : "",
        email: !validateEmail(formData.email) ? "Please enter a valid email address" : "",
        dob: !formData.dob ? "Date of birth is required" : (new Date(formData.dob) >= new Date() ? "DOB must be in the past" : "")
    };

    const isFormValid = !errors.name && !errors.email && !errors.dob;

    const handleContinue = async () => {
        if (!isFormValid || status.isLoading) return;

        setStatus(prev => ({ ...prev, isLoading: true, error: '' }));
        haptics.medium();

        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No authenticated user found");

            await setDoc(doc(db, "users", user.uid), {
                name: formData.name.trim(),
                email: formData.email.trim(),
                dob: formData.dob,
                phoneNumber: user.phoneNumber,
                profileCompleted: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });

            haptics.success();
            onComplete();
        } catch (err) {
            console.error("Onboarding Save Error:", err);
            setStatus(prev => ({ ...prev, error: "Failed to save details. Please try again." }));
            haptics.error();
        } finally {
            setStatus(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleTouch = (field) => {
        setStatus(prev => ({
            ...prev,
            touched: { ...prev.touched, [field]: true }
        }));
    };

    const inputContainerStyle = (field) => ({
        position: 'relative',
        marginBottom: '20px'
    });

    const labelStyle = (field) => ({
        position: 'absolute',
        left: '48px',
        top: formData[field] ? '14px' : '50%',
        transform: formData[field] ? 'none' : 'translateY(-50%)',
        fontSize: formData[field] ? '11px' : '15px',
        fontWeight: '600',
        color: formData[field] ? '#94A3B8' : '#6B7280',
        pointerEvents: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 5
    });

    const inputStyle = (field) => ({
        width: '100%',
        height: '64px',
        padding: `28px 16px 8px 48px`,
        borderRadius: '16px',
        border: `1.5px solid ${status.touched[field] && errors[field] ? '#FCA5A5' : (formData[field] ? '#111827' : '#F1F5F9')}`,
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        outline: 'none',
        backgroundColor: '#F8FAFC',
        transition: 'all 0.2s ease',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center'
    });

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)'
        }}>
            {/* Background click handler removed to prevent dismissal */}

            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    backgroundColor: '#ffffff',
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px',
                    padding: '24px 24px 40px 24px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
                }}
            >
                {/* Header with Back Button */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        style={{
                            background: '#F1F5F9',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            marginRight: '12px'
                        }}
                    >
                        <ArrowLeft size={20} color="#111827" />
                    </motion.button>
                </div>

                <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
                        Welcome to NexRide
                    </h1>
                    <p style={{ fontSize: '15px', color: '#64748B', margin: 0 }}>
                        This helps us personalize your experience
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Full Name */}
                    <div style={inputContainerStyle('name')}>
                        <User size={20} color={formData.name ? "#111827" : "#CBD5E1"} style={{ position: 'absolute', left: '16px', top: '32px', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <label style={labelStyle('name')}>Full Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/\b\w/g, l => l.toUpperCase()) })}
                            onBlur={() => handleTouch('name')}
                            style={inputStyle('name')}
                        />
                        <AnimatePresence>
                            {status.touched.name && errors.name && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '500', marginLeft: '12px' }}>
                                    {errors.name}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Email Address */}
                    <div style={inputContainerStyle('email')}>
                        <Mail size={20} color={formData.email ? "#111827" : "#CBD5E1"} style={{ position: 'absolute', left: '16px', top: '32px', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <label style={labelStyle('email')}>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            onBlur={() => handleTouch('email')}
                            style={inputStyle('email')}
                        />
                        <AnimatePresence>
                            {status.touched.email && errors.email && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '500', marginLeft: '12px' }}>
                                    {errors.email}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Date of Birth */}
                    <div style={inputContainerStyle('dob')}>
                        <Calendar size={20} color={formData.dob ? "#111827" : "#CBD5E1"} style={{ position: 'absolute', left: '16px', top: '32px', transform: 'translateY(-50%)', zIndex: 2 }} />
                        <label style={labelStyle('dob')}>Date of Birth</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => {
                                    setFormData({ ...formData, dob: e.target.value });
                                    handleTouch('dob');
                                }}
                                onKeyDown={(e) => e.preventDefault()}
                                max={new Date().toISOString().split('T')[0]}
                                style={inputStyle('dob')}
                            />
                            {/* Overlay to catch clicks and prevent manual typing if needed,
                                but native type="date" is usually better left alone on mobile */}
                        </div>
                        <AnimatePresence>
                            {status.touched.dob && errors.dob && (
                                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px', fontWeight: '500', marginLeft: '12px' }}>
                                    {errors.dob}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {status.error && (
                    <div style={{ backgroundColor: '#FEF2F2', padding: '12px 16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #FCA5A5' }}>
                        <p style={{ color: '#B91C1C', fontSize: '14px', fontWeight: '500', margin: 0 }}>{status.error}</p>
                    </div>
                )}

                <div style={{ marginTop: '12px' }}>
                    <motion.button
                        whileTap={isFormValid ? { scale: 0.98 } : {}}
                        onClick={handleContinue}
                        disabled={!isFormValid || status.isLoading}
                        style={{
                            width: '100%',
                            height: '56px',
                            backgroundColor: isFormValid ? '#111827' : '#E5E7EB',
                            color: isFormValid ? '#ffffff' : '#9CA3AF',
                            borderRadius: '18px',
                            border: 'none',
                            fontSize: '17px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            cursor: isFormValid ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: isFormValid ? '0 10px 20px rgba(17, 24, 39, 0.15)' : 'none'
                        }}
                    >
                        {status.isLoading ? 'Setting up...' : 'Continue'}
                        {!status.isLoading && <ArrowRight size={20} strokeWidth={2.5} />}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingHoverCard;
