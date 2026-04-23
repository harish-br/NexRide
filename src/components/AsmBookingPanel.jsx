import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import haptics from '../utils/haptics';

export default function AsmBookingPanel({ route, onClose }) {
    const [step, setStep] = useState('form'); // 'form' or 'success'
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const PRICE_PER_SEAT = 120;
    const isReadyToBook = selectedSeats.length > 0 && phone.length >= 10 && name.length > 1;

    // Handle Mock Seat Click
    const toggleSeat = (seatId) => {
        haptics.light();
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(prev => prev.filter(id => id !== seatId));
        } else {
            if (selectedSeats.length < 4) {
                setSelectedSeats(prev => [...prev, seatId]);
            }
        }
    };

    const handleConfirm = () => {
        haptics.success();
        
        const generatedId = "ASM" + Math.floor(100000 + Math.random() * 900000);
        const durationStr = route?.duration || "2 hr"; // Fallback to 2 hr
        const newTicket = {
            ticketId: generatedId,
            creationTime: Date.now(),
            expiryTime: Date.now() + 3600000 * 2, // 2 hr expiry
            fare: selectedSeats.length * PRICE_PER_SEAT,
            passengers: selectedSeats.length,
            origin: route?.origin || "Erode",
            destination: route?.destination || "Coimbatore",
            busType: "A.S.M Special", 
            isPaid: true
        };

        // Connect back to the standard NexRide TicketsTab
        const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
        existingTickets.unshift(newTicket);
        localStorage.setItem('tickets', JSON.stringify(existingTickets));
        
        // Custom dedicated tracking if owner needs it isolated
        const asmHistory = JSON.parse(localStorage.getItem('asm_bookings') || '[]');
        asmHistory.push({ ...newTicket, name, phone, selectedSeats });
        localStorage.setItem('asm_bookings', JSON.stringify(asmHistory));

        setStep('success');
    };

    if (step === 'success') {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '0 16px' }}>
                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <CheckCircle size={64} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Booking Confirmed!</h2>
                    <p style={{ color: '#6B7280', fontSize: '15px' }}>Your A.S.M Special seats have been secured.</p>
                </div>
                
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: '#6B7280' }}>Seats</span>
                        <span style={{ fontWeight: 'bold', color: '#111827' }}>{selectedSeats.join(', ')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6B7280' }}>Total Paid</span>
                        <span style={{ fontWeight: 'bold', color: '#10B981' }}>₹{selectedSeats.length * PRICE_PER_SEAT}</span>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '12px', background: '#111827', color: 'white',
                        fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer'
                    }}
                >
                    View in Tickets
                </button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 4px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <ArrowLeft size={24} color="#111827" />
                </button>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '18px', color: '#111827' }}>
                    {route?.routeNumber || 'A.S.M Special'}
                </div>
                <div style={{ width: 32 }} /> {/* Spacer */}
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 24, padding: '0 8px' }}>
                {/* Info Card */}
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#92400E' }}>{route?.origin || 'Erode'} → {route?.destination || 'Coimbatore'}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#B45309' }}>{route?.frequency?.replace('Dep: ', '') || '05:00 AM'}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#B45309' }}>A.S.M Premium AC class</div>
                </div>

                {/* Seat Map */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Select Seats (Max 4)</h3>
                <div style={{ background: '#F9FAFB', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', gridTemplateAreas: '"left1 right1 space right2 right3"' }}>
                        {[...Array(40)].map((_, i) => {
                            const row = Math.floor(i / 4) + 1;
                            const col = (i % 4);
                            const letter = ['L1', 'L2', 'R1', 'R2'][col];
                            const seatId = `${row}${letter}`;
                            
                            const isSelected = selectedSeats.includes(seatId);
                            // Mocking some taken seats arbitrarily for realism
                            const isTaken = (i % 7 === 0) || (i % 11 === 0);

                            return (
                                <React.Fragment key={seatId}>
                                    {col === 2 && <div style={{ width: '16px' }} />} {/* Aisle */}
                                    <button
                                        disabled={isTaken}
                                        onClick={() => !isTaken && toggleSeat(seatId)}
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '8px', border: 'none', cursor: isTaken ? 'not-allowed' : 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold',
                                            background: isTaken ? '#E5E7EB' : isSelected ? '#10B981' : 'white',
                                            color: isTaken ? '#9CA3AF' : isSelected ? 'white' : '#6B7280',
                                            border: isTaken ? 'none' : isSelected ? 'none' : '1px solid #D1D5DB',
                                            transition: 'all 0.2s', boxShadow: !isTaken && !isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                        }}
                                    >
                                        {isSelected ? '✓' : ''}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Patient Details */}
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Passenger Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <input 
                        type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px' }}
                    />
                    <input 
                        type="tel" placeholder="Mobile Number (required)" value={phone} onChange={e => setPhone(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '15px' }}
                    />
                </div>
            </div>

            {/* Sticky Footer */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontSize: '13px', color: '#6B7280' }}>Total Price</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>₹{selectedSeats.length * PRICE_PER_SEAT}</div>
                </div>
                <motion.button 
                    whileTap={{ scale: isReadyToBook ? 0.95 : 1 }}
                    disabled={!isReadyToBook}
                    onClick={handleConfirm}
                    style={{
                        padding: '14px 32px', borderRadius: '12px', border: 'none',
                        background: isReadyToBook ? '#10B981' : '#D1D5DB',
                        color: 'white', fontWeight: '600', fontSize: '16px', cursor: isReadyToBook ? 'pointer' : 'not-allowed',
                        transition: 'background 0.2s'
                    }}
                >
                    Pay & Confirm
                </motion.button>
            </div>
        </div>
    );
}
