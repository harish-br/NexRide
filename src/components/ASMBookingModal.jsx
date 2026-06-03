import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Ticket, MapPin, User, Phone, Mail, Clock, ShieldCheck } from 'lucide-react';
import haptics from '../utils/haptics';
import EstimatedTimeDisplay from './EstimatedTimeDisplay';

const ASMBookingModal = ({ isOpen, onClose, bus }) => {
    const [step, setStep] = useState('form'); // 'form' | 'success'
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: ''
    });
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookingId, setBookingId] = useState(null);

    const pricePerSeat = 150; // Mock price

    // Handle Seat Click
    const toggleSeat = (seatId) => {
        haptics.light();
        setSelectedSeats(prev => 
            prev.includes(seatId) 
                ? prev.filter(s => s !== seatId)
                : [...prev, seatId]
        );
    };

    const handleConfirm = () => {
        if (!formData.name || !formData.phone || selectedSeats.length === 0) {
            alert("Please fill in Name, Phone, and select at least one seat.");
            return;
        }

        haptics.impact();
        
        // Generate Mock Booking ID
        const generatedId = `ASM${Math.floor(100000 + Math.random() * 900000)}`;
        setBookingId(generatedId);

        // Store internally/locally
        const bookingRecord = {
            id: generatedId,
            route: `${bus.from} to ${bus.to}`,
            time: bus.departureTime,
            seats: selectedSeats,
            totalPrice: selectedSeats.length * pricePerSeat,
            passengerInfo: formData,
            date: new Date().toISOString()
        };
        
        // Mock saving to local storage
        const existingBookings = JSON.parse(localStorage.getItem('asm_bookings') || '[]');
        localStorage.setItem('asm_bookings', JSON.stringify([...existingBookings, bookingRecord]));

        setStep('success');
    };

    const handleClose = () => {
        haptics.light();
        // reset state on close
        setTimeout(() => {
            setStep('form');
            setFormData({ name: '', phone: '', email: '' });
            setSelectedSeats([]);
        }, 300);
        onClose();
    };

    // Make Mock Grid Layout (4 rows, 4 seats per row with an aisle)
    const renderSeatGrid = () => {
        const rows = 4;
        const layout = [];
        for (let r = 1; r <= rows; r++) {
            layout.push(
                <div key={`row-${r}`} style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[...Array(2)].map((_, i) => {
                            const seatId = `${r}${String.fromCharCode(65 + i)}`;
                            const isSelected = selectedSeats.includes(seatId);
                            return (
                                <button 
                                    key={seatId}
                                    onClick={() => toggleSeat(seatId)}
                                    style={{
                                        width: '36px', height: '36px',
                                        borderRadius: '8px',
                                        border: isSelected ? '2px solid #F59E0B' : '2px solid #E5E7EB',
                                        background: isSelected ? '#FEF3C7' : 'white',
                                        color: isSelected ? '#B45309' : '#9CA3AF',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {seatId}
                                </button>
                            );
                        })}
                    </div>
                    {/* Aisle */}
                    <div style={{ width: '16px' }}></div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[...Array(2)].map((_, i) => {
                            const seatId = `${r}${String.fromCharCode(67 + i)}`; // C, D
                            const isSelected = selectedSeats.includes(seatId);
                            return (
                                <button 
                                    key={seatId}
                                    onClick={() => toggleSeat(seatId)}
                                    style={{
                                        width: '36px', height: '36px',
                                        borderRadius: '8px',
                                        border: isSelected ? '2px solid #F59E0B' : '2px solid #E5E7EB',
                                        background: isSelected ? '#FEF3C7' : 'white',
                                        color: isSelected ? '#B45309' : '#9CA3AF',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {seatId}
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }
        return layout;
    };

    if (!bus) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 4000,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)'
                        }}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            height: '90vh',
                            background: '#F9FAFB',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            zIndex: 4001,
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px',
                            display: 'flex', alignItems: 'center',
                            background: 'white',
                            borderTopLeftRadius: '24px',
                            borderTopRightRadius: '24px',
                            borderBottom: '1px solid #F3F4F6',
                            position: 'sticky', top: 0, zIndex: 10
                        }}>
                            {step === 'form' && (
                                <button onClick={handleClose} style={{
                                    background: '#F3F4F6', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginRight: '12px', cursor: 'pointer'
                                }}>
                                    <ArrowLeft size={20} color="#374151" />
                                </button>
                            )}
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 }}>
                                {step === 'form' ? 'Checkout' : 'Booking Confirmed'}
                            </h2>
                            {step === 'form' && (
                                <div style={{ marginLeft: 'auto', background: '#FEF3C7', color: '#B45309', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' }}>
                                    A.S.M Special
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {step === 'form' ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* Route Overview Card */}
                                    <div style={{
                                        background: 'white', borderRadius: '16px', padding: '16px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '24px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <EstimatedTimeDisplay time={bus.departureTime} style={{ fontSize: '20px', fontWeight: 700, color: '#111' }} />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280', fontSize: '14px', fontWeight: 500 }}>
                                                <Clock size={16} /> Approx 2h 30m
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#111' }}></div>
                                                <div style={{ width: '2px', height: '24px', background: '#E5E7EB', margin: '4px 0' }}></div>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }}></div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                                                <div style={{ fontSize: '15px', fontWeight: 600 }}>{bus.from}</div>
                                                <div style={{ fontSize: '15px', fontWeight: 600 }}>{bus.to}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>Select Seats ({selectedSeats.length})</h4>
                                    
                                    <div style={{
                                        background: 'white', borderRadius: '16px', padding: '24px 16px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '24px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center'
                                    }}>
                                        {/* Steering Wheel Indicator */}
                                        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', paddingRight: '20px' }}>
                                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#9CA3AF' }}></div>
                                        </div>
                                        
                                        {renderSeatGrid()}
                                    </div>

                                    <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#111', marginBottom: '12px' }}>Passenger Details</h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '120px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input 
                                                value={formData.name}
                                                onChange={e => setFormData({...formData, name: e.target.value})}
                                                placeholder="Full Name" 
                                                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Phone size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input 
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                type="tel"
                                                placeholder="Phone Number" 
                                                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <Mail size={18} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input 
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                type="email"
                                                placeholder="Email (Optional)" 
                                                style={{ width: '100%', padding: '16px 16px 16px 44px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                // SUCCESS STATE
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', paddingBottom: '120px' }}
                                >
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                        <CheckCircle size={40} color="#16A34A" />
                                    </div>
                                    <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px' }}>Booking Confirmed!</h3>
                                    <p style={{ fontSize: '15px', color: '#6B7280', marginBottom: '32px' }}>Your ticket has been secured.</p>
                                    
                                    <div style={{ width: '100%', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative' }}>
                                        {/* Ticket Cutouts */}
                                        <div style={{ position: 'absolute', left: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: '#F9FAFB' }}></div>
                                        <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', borderRadius: '50%', background: '#F9FAFB' }}></div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px dashed #E5E7EB', paddingBottom: '16px', marginBottom: '16px' }}>
                                            <div>
                                                <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Booking ID</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>{bookingId}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Seat(s)</div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B' }}>{selectedSeats.join(', ')}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{bus.from}</div>
                                            <ArrowLeft size={16} color="#9CA3AF" style={{ transform: 'rotate(180deg)' }} />
                                            <div style={{ fontSize: '16px', fontWeight: 600 }}>{bus.to}</div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '14px', fontWeight: 500 }}>
                                            <Clock size={16} color="#9CA3AF" /> <EstimatedTimeDisplay time={bus.departureTime} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Sticky Bottom Action */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            background: 'white', borderTop: '1px solid #F3F4F6',
                            padding: '16px 20px', paddingBottom: 'env(safe-area-inset-bottom, 24px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            boxShadow: '0 -4px 12px rgba(0,0,0,0.02)'
                        }}>
                            {step === 'form' ? (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>Total Amount</span>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>
                                            ₹{selectedSeats.length * pricePerSeat}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleConfirm}
                                        style={{
                                            background: selectedSeats.length > 0 ? '#F59E0B' : '#F3F4F6',
                                            color: selectedSeats.length > 0 ? 'white' : '#9CA3AF',
                                            border: 'none', borderRadius: '12px',
                                            padding: '14px 24px', fontSize: '16px', fontWeight: '600',
                                            cursor: selectedSeats.length > 0 ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                        disabled={selectedSeats.length === 0}
                                    >
                                        <Ticket size={20} />
                                        Book Now
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handleClose}
                                    style={{
                                        background: '#111', color: 'white',
                                        border: 'none', borderRadius: '12px', width: '100%',
                                        padding: '16px', fontSize: '16px', fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Done
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ASMBookingModal;
