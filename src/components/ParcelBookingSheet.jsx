import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ArrowUpDown, ChevronDown, Check,
    Truck, Package, MapPin, Info, Search, ArrowLeft,
    Shield, CheckCircle, AlertTriangle
} from 'lucide-react';
import haptics from '../utils/haptics';
import { busSchedules, busStops } from '../data/busSchedules';
import bus3d from '../assets/bus-3d.png';
import parcelIcon from '../paper-parcel-delivery-box-icon-isolated-3d-render-illustration.png';

const ParcelBookingSheet = ({ isOpen, onClose }) => {
    // --- UI State ---
    const [isOperatorListOpen, setIsOperatorListOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null); // 'from' | 'to' | null
    const [showReview, setShowReview] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // --- Selection State ---
    const [selectedOperator, setSelectedOperator] = useState(null);
    const [sourceStop, setSourceStop] = useState(null);
    const [destinationStop, setDestinationStop] = useState(null);

    // --- Dynamic Data Helpers ---
    const availableOperators = useMemo(() => {
        const filtered = Array.from(new Set(busSchedules.map(b => b.operatorName)))
            .filter(name => name && name.toLowerCase().includes('a.s.m'))
            .map(name => {
                const schedule = busSchedules.find(b => b.operatorName === name);
                const displayName = name.toUpperCase().includes('A.S.M') ? 'A.S.M' : name;
                let serviceType = schedule?.serviceType || 'Private';
                // Simplify service type to "Private" if it contains it
                if (serviceType.toLowerCase().includes('private')) {
                    serviceType = 'Private';
                }
                return { name: displayName, serviceType };
            });

        // Fallback to A.S.M if no operators found (since this sheet is focused on A.S.M)
        if (filtered.length === 0) {
            return [{ name: 'A.S.M', serviceType: 'Private' }];
        }
        return filtered;
    }, []);

    const availableStops = useMemo(() => [
        { id: 'asm1', name: 'Anthiyur bus stand' },
        { id: 'asm2', name: 'Thavittupalayam' },
        { id: 'asm3', name: 'Pazhaiya Mettur' },
        { id: 'asm4', name: 'Chinnathambipalayam' },
        { id: 'asm5', name: 'Thoppur' },
        { id: 'asm6', name: 'Ammapalayam' },
        { id: 'asm7', name: 'Athani' },
        { id: 'asm8', name: 'Savandapur' },
        { id: 'asm9', name: 'Pudhukaraipudhur' },
        { id: 'asm10', name: 'Pariyur' },
        { id: 'asm11', name: 'Nanjagaundanpalayam' },
        { id: 'asm12', name: 'Gobichettipalayam' },
        { id: 'asm13', name: 'Kuthirai vandi theru' },
        { id: 'asm14', name: 'Vadugapalayam Pudur' },
        { id: 'asm15', name: 'Modachur' },
        { id: 'asm16', name: 'Kolapalur' },
        { id: 'asm17', name: 'Nambiyur' },
        { id: 'asm18', name: 'Pothampalayam' },
        { id: 'asm19', name: 'Sevur' },
        { id: 'asm20', name: 'Avinashi' },
        { id: 'asm21', name: 'Thekkalur' },
        { id: 'asm22', name: 'Karumathampatti' },
        { id: 'asm23', name: 'Arasur' },
        { id: 'asm24', name: 'Neelambur' },
        { id: 'asm25', name: 'Airport' },
        { id: 'asm26', name: 'Kmch hospital' },
        { id: 'asm27', name: 'PSG college of Arts and Science' },
        { id: 'asm28', name: 'Peelamedu' },
        { id: 'asm29', name: 'Hopes College' },
        { id: 'asm30', name: 'PSG college of Technology' },
        { id: 'asm31', name: 'Gandhipuram Bus Terminus' }
    ], []);

    const fare = useMemo(() => {
        if (selectedOperator && sourceStop && destinationStop) {
            // Extract numeric part from IDs
            const sIdx = parseInt(sourceStop.id.replace(/\D/g, '')) || 0;
            const dIdx = parseInt(destinationStop.id.replace(/\D/g, '')) || 0;
            const diff = Math.abs(sIdx - dIdx);

            // Formula: Base 50, Max 200, scales with distance
            const baseFare = 50;
            const distanceRate = diff * 5;
            const total = baseFare + distanceRate;

            return Math.min(200, Math.max(50, total));
        }
        return 0;
    }, [selectedOperator, sourceStop, destinationStop]);

    const isFormValid = selectedOperator && sourceStop && destinationStop && fare > 0;

    // --- Handlers ---
    const handleClose = () => {
        haptics.light();
        onClose();
        setTimeout(() => {
            setSelectedOperator(null);
            setSourceStop(null);
            setDestinationStop(null);
            setIsOperatorListOpen(false);
            setActiveDropdown(null);
            setShowReview(false);
            setAgreedToTerms(false);
        }, 300);
    };

    const handleSwap = (e) => {
        e.stopPropagation();
        if (!sourceStop && !destinationStop) return;
        haptics.medium();
        const temp = sourceStop;
        setSourceStop(destinationStop);
        setDestinationStop(temp);
    };

    const handleStopSelect = (stop, type) => {
        haptics.light();
        if (type === 'from') {
            if (destinationStop?.id === stop.id) {
                setDestinationStop(null);
            }
            setSourceStop(stop);
        } else {
            if (sourceStop?.id === stop.id) return; // Prevent same
            setDestinationStop(stop);
        }
        setActiveDropdown(null);
    };

    const handleConfirm = () => {
        if (!isFormValid) return;
        haptics.heavy();
        alert(`Parcel Booking Confirmed!\nOperator: ${selectedOperator.name}\nRoute: ${sourceStop.name} → ${destinationStop.name}\nFare: ₹${fare}`);
        handleClose();
    };

    if (!isOpen) return null;

    // --- SUB-COMPONENT: Selection Overlay ---
    const SelectionOverlay = ({ type, onClose }) => {
        const [searchQuery, setSearchQuery] = useState('');
        const label = type === 'from' ? 'Source stop' : 'To stop';
        const title = type === 'from' ? 'Edit Source' : 'Edit Destination';
        const selectedStop = type === 'from' ? sourceStop : destinationStop;
        const otherStop = type === 'from' ? destinationStop : sourceStop;

        const filteredStops = useMemo(() => {
            return availableStops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }, [searchQuery]);

        return (
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 350 }}
                style={{
                    position: 'absolute', inset: 0, zIndex: 1000,
                    background: '#F8FAFC', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header from Image */}
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute', left: '20px', width: '36px', height: '36px',
                            borderRadius: '50%', background: '#E2E8F0', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <X size={18} color="#475569" />
                    </button>
                    <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
                    {/* Top Active Card */}
                    {/* Top Active Card */}
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', padding: '24px 20px',
                        marginBottom: '24px', textAlign: 'center', border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                            background: type === 'from' ? '#2563EB' : '#F59E0B' 
                        }} />
                        <div style={{ 
                            fontSize: '11px', fontWeight: 800, color: '#64748B', 
                            textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' 
                        }}>
                            {label}
                        </div>
                        <div style={{ 
                            fontSize: '18px', fontWeight: 700, 
                            color: selectedStop ? '#1E293B' : '#CBD5E1',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            {type === 'from' ? <MapPin size={18} color="#2563EB" /> : <MapPin size={18} color="#F59E0B" />}
                            {selectedStop ? selectedStop.name : (type === 'from' ? "Choose source station" : "Choose destination")}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            placeholder="Search station..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', height: '48px', borderRadius: '12px', border: '1px solid #E5E7EB',
                                padding: '0 16px 0 42px', fontSize: '15px', background: '#FFFFFF', outline: 'none'
                            }}
                        />
                    </div>

                    {/* List Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredStops.map((stop) => {
                            const isSelected = selectedStop?.id === stop.id;
                            const isDisabled = otherStop?.id === stop.id;

                            return (
                                <motion.div
                                    key={stop.id}
                                    whileTap={!isDisabled ? { scale: 0.98 } : {}}
                                    onClick={() => !isDisabled && handleStopSelect(stop, type)}
                                    style={{
                                        padding: '18px', borderRadius: '14px', background: isSelected ? '#2563EB' : '#FFFFFF',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: isSelected ? '1px solid #2563EB' : '1px solid #E5E7EB',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                        opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: isSelected ? '#FFFFFF' : '#334155', textAlign: 'center' }}>
                                        {stop.name}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        );
    };

    const ReviewParcelOverlay = ({ onClose, onConfirm }) => {
        const dividerStyle = { height: '1px', background: '#E5E7EB', margin: '20px 0' };
        const sectionTitleStyle = {
            fontSize: '18px', fontWeight: 600, color: '#111827',
            marginTop: '24px', marginBottom: '12px'
        };
        const bodyTextStyle = {
            fontSize: '16px', fontWeight: 400, color: '#374151',
            lineHeight: '1.6'
        };
        const secondaryTextStyle = {
            fontSize: '14px', color: '#6B7280',
            lineHeight: '1.5'
        };

        return (
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 350 }}
                style={{
                    position: 'absolute', inset: 0, zIndex: 2000,
                    background: '#FFFFFF', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center',
                    background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10,
                    borderBottom: '1px solid #E5E7EB'
                }}>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-8px'
                    }}>
                        <ArrowLeft size={24} color="#111827" />
                    </button>
                    <h2 style={{ flex: 1, textAlign: 'center', fontSize: '22px', fontWeight: 600, color: '#111827', margin: 0, marginRight: '40px' }}>Review delivery</h2>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ padding: '16px 20px 40px 20px' }}>

                        {/* Section 1: Guidelines */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={sectionTitleStyle}>Review package guidelines</h3>
                            <p style={{ ...bodyTextStyle, marginBottom: '12px' }}>For a successful delivery, please make sure your package:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '16px' }}>
                                {[
                                    "Fits within the size and weight limits of the selected vehicle",
                                    "Is securely packed and sealed",
                                    "Does not contain items that may leak or get damaged",
                                    "Has a value within the recommended limit (₹5000 or less)",
                                    "Is ready for pickup at the selected time"
                                ].map((text, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <span style={{ fontSize: '18px', lineHeight: '24px', color: '#374151' }}>•</span>
                                        <span style={bodyTextStyle}>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={dividerStyle} />

                        {/* Section 2: Prohibited items */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={sectionTitleStyle}>Prohibited items</h3>
                            <p style={{ ...bodyTextStyle, marginBottom: '14px' }}>The following items are not allowed for delivery:</p>
                            <p style={{ ...bodyTextStyle, marginBottom: '14px' }}>
                                Alcohol, illegal substances, drugs, hazardous or flammable materials, weapons, and items of high or irreplaceable value are prohibited.
                            </p>
                            <p style={bodyTextStyle}>
                                All deliveries must comply with applicable laws and platform policies. Violations may lead to cancellation and further action if required.
                            </p>
                        </div>

                        <div style={dividerStyle} />

                        {/* Section 3: Delivery Completion */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={sectionTitleStyle}>If your delivery can’t be completed</h3>
                            <p style={bodyTextStyle}>
                                If the delivery cannot be completed, return charges may apply. The parcel may be held for a limited time before being returned or disposed of, depending on the item type.
                            </p>
                        </div>

                        {/* Footer Disclaimer */}
                        <div style={{ marginTop: '40px' }}>
                            <p style={secondaryTextStyle}>
                                NexRide does not provide insurance for parcels unless explicitly mentioned. By confirming, you agree to the <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Terms & Conditions</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fixed CTA Footer */}
                <div style={{
                    padding: '20px', paddingBottom: 'env(safe-area-inset-bottom, 24px)',
                    background: '#FFFFFF', borderTop: '1px solid #E5E7EB'
                }}>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onConfirm}
                        style={{
                            width: '100%', height: '54px', borderRadius: '16px',
                            background: '#2563EB',
                            color: '#FFFFFF', border: 'none', fontSize: '16px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        Confirm delivery • ₹{fare}
                    </motion.button>
                </div>
            </motion.div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 3000,
                            background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)'
                        }}
                    />

                    {/* Sheet Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 3001,
                            background: '#FFFFFF',
                            borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
                            height: '92vh',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.12)'
                        }}
                    >
                        {/* --- OVERLAYS --- */}
                        <AnimatePresence>
                            {activeDropdown && (
                                <SelectionOverlay type={activeDropdown} onClose={() => setActiveDropdown(null)} />
                            )}
                            {showReview && (
                                <ReviewParcelOverlay
                                    onClose={() => setShowReview(false)}
                                    onConfirm={handleConfirm}
                                />
                            )}
                        </AnimatePresence>

                        {/* --- HEADER --- */}
                        <div style={{
                            padding: '16px 20px', display: 'flex', alignItems: 'center',
                            borderBottom: '1px solid #E5E7EB', background: 'white',
                            position: 'sticky', top: 0, zIndex: 100
                        }}>
                            <button onClick={handleClose} style={{
                                width: 40, height: 40, borderRadius: '50%', background: '#F8FAFC', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                            }}>
                                <X size={20} color="#64748B" />
                            </button>
                            <div style={{ flex: 1, textAlign: 'center' }}>
                                <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Parcel Booking</h1>
                            </div>
                            <div style={{ width: 40 }} />
                        </div>

                        {/* --- SCROLLABLE CONTENT --- */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
                            {/* SECTION 1: OPERATOR SELECTION */}
                            <div style={{ marginBottom: '28px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '0.8px' }}>
                                    Select Operator / Bus
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <motion.div
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => setIsOperatorListOpen(!isOperatorListOpen)}
                                        style={{
                                            background: '#F8FAFC', padding: '16px 16px 16px 8px', borderRadius: '16px',
                                            border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '10px',
                                            background: '#F3F4F6', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', border: 'none', overflow: 'hidden'
                                        }}>
                                            <img src="/icons/bus_icon_minimal.jpg" alt="bus" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '16px', fontWeight: 600, color: selectedOperator ? '#0F172A' : '#94A3B8' }}>
                                                {selectedOperator ? selectedOperator.name : "Choose operator or bus"}
                                            </div>
                                            {selectedOperator && <div style={{ fontSize: '11px', color: '#64748B' }}>{selectedOperator.serviceType}</div>}
                                        </div>
                                        <ChevronDown size={20} color="#94A3B8" style={{ transform: isOperatorListOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                                    </motion.div>

                                    {/* Operator Dropdown */}
                                    <AnimatePresence>
                                        {isOperatorListOpen && (
                                            <>
                                                {/* Transparent Backdrop for click-outside */}
                                                <div 
                                                    style={{ 
                                                        position: 'fixed', 
                                                        inset: 0, 
                                                        zIndex: 109,
                                                        cursor: 'default'
                                                    }} 
                                                    onClick={() => setIsOperatorListOpen(false)} 
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }} 
                                                    animate={{ opacity: 1, y: 0 }} 
                                                    exit={{ opacity: 0, y: -10 }}
                                                    style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: 'white', borderRadius: '16px', marginTop: '8px',
                                                        boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 110,
                                                        border: '1px solid #E5E7EB', overflow: 'hidden',
                                                        maxHeight: '280px', overflowY: 'auto'
                                                    }}
                                                >
                                                    {availableOperators.map((op, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => { setSelectedOperator(op); setIsOperatorListOpen(false); haptics.light(); }}
                                                            style={{
                                                                padding: '14px 16px 14px 8px', 
                                                                borderBottom: idx === availableOperators.length - 1 ? 'none' : '1px solid #F1F5F9',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                                                background: selectedOperator?.name === op.name ? '#EFF6FF' : 'transparent',
                                                                transition: 'background 0.2s'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{
                                                                    width: '48px', height: '48px', borderRadius: '10px',
                                                                    background: '#F3F4F6', display: 'flex', alignItems: 'center',
                                                                    justifyContent: 'center', border: 'none', overflow: 'hidden'
                                                                }}>
                                                                    <img src="/icons/bus_icon_minimal.jpg" alt="bus" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{op.name}</div>
                                                                    <div style={{ fontSize: '11px', color: '#64748B' }}>{op.serviceType}</div>
                                                                </div>
                                                            </div>
                                                            {selectedOperator?.name === op.name && <Check size={18} color="#2563EB" />}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* SECTION 2: ROUTE SELECTION (Simplified for Overlay Trigger) */}
                            <div style={{
                                marginBottom: '28px',
                                opacity: selectedOperator ? 1 : 0.6,
                                pointerEvents: selectedOperator ? 'auto' : 'none',
                                filter: selectedOperator ? 'none' : 'grayscale(0.5)',
                                transition: '0.3s'
                            }}>
                                <label style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px', display: 'block', letterSpacing: '0.8px' }}>
                                    Route Selection {!selectedOperator && <span style={{ fontSize: '10px', textTransform: 'none', color: '#94A3B8', fontWeight: 500 }}>(Select operator first)</span>}
                                </label>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Trigger From */}
                                    <motion.div
                                        whileTap={selectedOperator ? { scale: 0.98 } : {}}
                                        onClick={() => { if (selectedOperator) { setActiveDropdown('from'); setIsOperatorListOpen(false); } }}
                                        style={{
                                            background: '#FFFFFF', padding: '24px 20px', borderRadius: '20px', 
                                            border: '1px solid #E2E8F0',
                                            textAlign: 'center', cursor: selectedOperator ? 'pointer' : 'not-allowed',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ 
                                            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                                            background: '#2563EB', opacity: selectedOperator ? 1 : 0.3 
                                        }} />
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>Source stop</div>
                                        <div style={{ 
                                            fontSize: '17px', fontWeight: 700, 
                                            color: sourceStop ? '#0F172A' : '#CBD5E1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}>
                                            <MapPin size={18} color={sourceStop ? '#2563EB' : '#CBD5E1'} />
                                            {sourceStop ? sourceStop.name : "Choose source station"}
                                        </div>
                                    </motion.div>

                                    {/* Swap Action */}
                                    <div style={{ display: 'flex', justifyContent: 'center', height: '0', position: 'relative', zIndex: 10 }}>
                                        <button
                                            onClick={handleSwap}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%', background: 'white', border: '1px solid #E5E7EB',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                cursor: 'pointer', transform: 'translateY(-50%)'
                                            }}
                                        >
                                            <ArrowUpDown size={18} color="#2563EB" />
                                        </button>
                                    </div>

                                    {/* Trigger To */}
                                    <motion.div
                                        whileTap={selectedOperator ? { scale: 0.98 } : {}}
                                        onClick={() => { if (selectedOperator) { setActiveDropdown('to'); setIsOperatorListOpen(false); } }}
                                        style={{
                                            background: '#FFFFFF', padding: '24px 20px', borderRadius: '20px', 
                                            border: '1px solid #E2E8F0',
                                            textAlign: 'center', cursor: selectedOperator ? 'pointer' : 'not-allowed',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                            position: 'relative', overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ 
                                            position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
                                            background: '#F59E0B', opacity: selectedOperator ? 1 : 0.3 
                                        }} />
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>To stop</div>
                                        <div style={{ 
                                            fontSize: '17px', fontWeight: 700, 
                                            color: destinationStop ? '#0F172A' : '#CBD5E1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                        }}>
                                            <MapPin size={18} color={destinationStop ? '#F59E0B' : '#CBD5E1'} />
                                            {destinationStop ? destinationStop.name : "Choose destination"}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>

                            {/* SECTION 3: FARE CALCULATION CARD */}
                            <AnimatePresence>
                                {isFormValid && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            background: '#EFF6FF', borderRadius: '20px', padding: '24px',
                                            border: '1px solid #DBEAFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            marginBottom: '120px'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                Estimated Fare <Info size={14} />
                                            </div>
                                            <div style={{ fontSize: '32px', fontWeight: 800, color: '#1E40AF' }}>₹ {fare}</div>
                                            <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Includes weight & size handling</div>
                                        </div>
                                        <motion.div 
                                            animate={{ 
                                                y: [0, -10, 0],
                                                scale: [1, 1.05, 1],
                                                rotate: [0, 2, 0, -2, 0]
                                            }}
                                            transition={{ 
                                                duration: 4, 
                                                repeat: Infinity, 
                                                ease: "easeInOut" 
                                            }}
                                            style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <img src={parcelIcon} alt="parcel" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>

                        {/* --- FIXED REVIEW BUTTON (Conditional) --- */}
                        <AnimatePresence>
                            {isFormValid && (
                                <motion.div
                                    initial={{ y: 100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 100, opacity: 0 }}
                                    style={{
                                        padding: '20px', background: 'white', borderTop: '1px solid #E5E7EB',
                                        paddingBottom: 'env(safe-area-inset-bottom, 24px)', zIndex: 100
                                    }}
                                >
                                    <motion.button
                                        whileTap={{ scale: 0.98 }} onClick={() => setShowReview(true)}
                                        style={{
                                            width: '100%', height: '62px', borderRadius: '16px',
                                            background: '#2563EB',
                                            color: 'white', border: 'none',
                                            fontSize: '17px', fontWeight: 800,
                                            cursor: 'pointer',
                                            boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.45)',
                                            transition: '0.3s'
                                        }}
                                    >
                                        Review Booking
                                    </motion.button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ParcelBookingSheet;
