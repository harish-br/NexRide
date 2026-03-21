import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, X, CheckCircle, AlertCircle } from 'lucide-react';
import haptics from '../utils/haptics';

const OTPModal = ({ isOpen, onClose, onSuccess }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [status, setStatus] = useState('idle'); // idle, verifying, success, error
    const inputRefs = [React.createRef(), React.createRef(), React.createRef(), React.createRef()];

    const handleChange = (index, value) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            inputRefs[index + 1].current.focus();
        }

        if (newOtp.every(v => v !== '')) {
            verifyOTP(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const verifyOTP = async (code) => {
        setStatus('verifying');
        // Mock verification
        setTimeout(() => {
            if (code === '1234') { // Mock valid OTP
                setStatus('success');
                haptics.success();
                setTimeout(() => {
                    setOtp(['', '', '', '']);
                    setStatus('idle');
                    onSuccess(code);
                }, 1000);
            } else {
                setStatus('error');
                haptics.error();
                setTimeout(() => {
                    setOtp(['', '', '', '']);
                    setStatus('idle');
                    inputRefs[0].current.focus();
                }, 1500);
            }
        }, 1000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '16px',
                    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)'
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{
                        background: 'white', borderRadius: '24px', padding: '24px',
                        width: '100%', maxWidth: '340px', position: 'relative',
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                    }}
                >
                    <button 
                        onClick={onClose}
                        style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px' }}
                    >
                        <X size={20} color="#6B7280" />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Key size={28} color="#3B82F6" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>Enter Ticket OTP</h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', textAlign: 'center' }}>Ask the conductor for the 4-digit token. <br/><br/>(Test with '1234')</p>
                        
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            {otp.map((d, i) => (
                                <input
                                    key={i}
                                    ref={inputRefs[i]}
                                    type="tel"
                                    maxLength={1}
                                    value={d}
                                    onChange={(e) => handleChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    style={{
                                        width: '48px', height: '56px', fontSize: '24px',
                                        textAlign: 'center', fontWeight: 'bold',
                                        borderRadius: '12px', border: status === 'error' ? '2px solid #EF4444' : '2px solid #E5E7EB',
                                        outline: 'none', color: '#111827',
                                        background: '#F9FAFB'
                                    }}
                                />
                            ))}
                        </div>

                        {status === 'verifying' && <p style={{ color: '#3B82F6', fontSize: '14px', margin: 0, marginTop: '8px', fontWeight: '500' }}>Verifying...</p>}
                        {status === 'success' && <p style={{ color: '#10B981', fontSize: '14px', margin: 0, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><CheckCircle size={18}/> Ticket Valid</p>}
                        {status === 'error' && <p style={{ color: '#EF4444', fontSize: '14px', margin: 0, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}><AlertCircle size={18}/> Invalid Code. Try again.</p>}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OTPModal;
