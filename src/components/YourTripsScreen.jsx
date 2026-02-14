import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Ticket, Bus, Train, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import haptics from '../utils/haptics';
import GlobalLoader from './GlobalLoader';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';
import busIconNew from '../assets/bus_option_new.png'; // Reusing existing asset
import emptyStateVideo from './LottieAnimations/profileicons/experimental-suitcase-with-stickers.mp4';
import historyEmptyIcon from './LottieAnimations/profileicons/3d-folder-with-papers-and-ai-stars_optimized.png';
import { QRCodeSVG } from 'qrcode.react';

const YourTripsScreen = ({ onBack, onBookRide, user = auth.currentUser }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

    // CACHE-FIRST INITIALIZATION
    const [tickets, setTickets] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('tickets') || '[]');
        } catch (e) {
            return [];
        }
    });

    // Only show full loader if we have NO data to show initially
    const [isLoading, setIsLoading] = useState(tickets.length === 0);
    const [viewingTicket, setViewingTicket] = useState(null); // For history details modal

    // Fetch Tickets from Firestore (Background Sync)
    useEffect(() => {
        // Double check user existence and UID
        if (!user || !user.uid) {
            setIsLoading(false);
            return;
        }

        let unsubscribe = () => { };

        try {
            const ticketsRef = collection(db, "users", user.uid, "tickets");
            const q = query(ticketsRef, orderBy("creationTime", "desc"));

            // This subscription will update the UI when data arrives (Network-First update)
            unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Update State
                setTickets(fetchedTickets);

                // Also update local cache for next time
                localStorage.setItem('tickets', JSON.stringify(fetchedTickets));

                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching tickets:", error);
                setIsLoading(false);
            });
        } catch (error) {
            console.error("Error creating ticket query:", error);
            setIsLoading(false);
        }

        return () => unsubscribe();
    }, [user]);

    // Derived State
    const now = Date.now();

    const activeTickets = tickets.filter(t => {
        // Active if NOT expired and NOT cancelled
        // Assuming expiryTime is reliable
        return (t.expiryTime > now) && t.status !== 'cancelled';
    });

    const historyTickets = tickets.filter(t => {
        // History if expired OR cancelled OR completed (manual status)
        return (t.expiryTime <= now) || t.status === 'cancelled' || t.status === 'completed';
    });

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: '#F9FAFB', zIndex: 50,
            display: 'flex', flexDirection: 'column',
            direction: isRTL ? 'rtl' : 'ltr'
        }}>
            {/* 1. Header */}
            <div style={{
                padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                backgroundColor: '#FFFFFF', borderBottom: '1px solid #F3F4F6',
                zIndex: 20
            }}>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { haptics.light(); onBack(); }}
                    style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex' }}
                >
                    <ChevronLeft size={24} color="#1F293B" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </motion.button>
                <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#1F293B', margin: 0 }}>
                    {t('trips.title')}
                </h1>
            </div>

            {/* 2. Sticky Tabs */}
            <div style={{
                display: 'flex', backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB', zIndex: 20,
                position: 'sticky', top: 0
            }}>
                {['active', 'history'].map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <div
                            key={tab}
                            onClick={() => {
                                if (activeTab !== tab) {
                                    haptics.light();
                                    setActiveTab(tab);
                                }
                            }}
                            style={{
                                flex: 1, padding: '16px', textAlign: 'center',
                                cursor: 'pointer', position: 'relative'
                            }}
                        >
                            <span style={{
                                fontSize: '15px',
                                fontWeight: isActive ? '600' : '400',
                                color: isActive ? '#2563EB' : '#6B7280',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s ease'
                            }}>
                                {t(`trips.${tab}`)}
                            </span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabUnderline"
                                    style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        height: '2px', backgroundColor: '#2563EB'
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <GlobalLoader />
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === 'active' ? (
                            <ActiveTripsList key="active" tickets={activeTickets} onBookRide={onBookRide} />
                        ) : (
                            <HistoryTripsList key="history" tickets={historyTickets} onViewResponse={(t) => setViewingTicket(t)} />
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Ticket Details Modal (Read Only) */}
            <AnimatePresence>
                {viewingTicket && (
                    <HistoryTicketModal ticket={viewingTicket} onClose={() => setViewingTicket(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

// ------------------------------------------------------------------
// SUB-COMPONENTS
// ------------------------------------------------------------------

const ActiveTripsList = ({ tickets, onBookRide }) => {
    const { t } = useTranslation();
    if (tickets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    padding: '40px 20px', textAlign: 'center', minHeight: 'calc(100vh - 180px)', paddingBottom: '100px'
                }}
            >
                <video
                    src={emptyStateVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                        width: '180px', height: '180px',
                        objectFit: 'cover',
                        marginBottom: '8px',
                        borderRadius: '20px' // Optional: if video needs rounded corners
                    }}
                />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1F293B', marginBottom: '8px' }}>
                    {t('trips.no_active')}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                    {t('trips.active_empty_sub')}
                </p>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.medium(); onBookRide(); }}
                    style={{
                        padding: '12px 24px', backgroundColor: '#2563EB', color: '#FFFFFF',
                        borderRadius: '100px', border: 'none', fontWeight: '600', fontSize: '15px',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                    }}
                >
                    {t('trips.active_cta')}
                </motion.button>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tickets.map(ticket => (
                <ActiveTicketItem key={ticket.ticketId} ticket={ticket} />
            ))}
        </div>
    );
};

const ActiveTicketItem = ({ ticket }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    // Basic countdown logic
    const [timeLeft, setTimeLeft] = useState('...');

    useEffect(() => {
        const updateTimer = () => {
            const now = Date.now();
            const diff = ticket.expiryTime - now;
            if (diff <= 0) {
                setTimeLeft(t('trips.expired'));
            } else {
                const h = Math.floor((diff / (1000 * 60 * 60)));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${h}h ${m}m`);
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every min is enough for list
        return () => clearInterval(interval);
    }, [ticket.expiryTime]);

    const isExpiringSoon = ticket.expiryTime - Date.now() < 3600000; // < 1 hour

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F8FAFC',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {ticket.transport === 'Bus' ? <img src={busIconNew} width={24} alt="Bus" /> : <Train size={24} color="#475569" />}
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1F293B' }}>
                            {ticket.route.replace('→', '➝')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>
                            {ticket.busType}
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: '4px 8px', borderRadius: '6px',
                    backgroundColor: isExpiringSoon ? '#FEF2F2' : '#ECFDF5',
                    color: isExpiringSoon ? '#B91C1C' : '#059669',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                }}>
                    {isExpiringSoon ? t('trips.expiring') : t('trips.active')}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#94A3B8" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
                        {t('trips.remaining', { time: timeLeft })}
                    </span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.5px' }}>
                    #{ticket.ticketId}
                </div>
            </div>
        </motion.div>
    );
};

const HistoryTripsList = ({ tickets, onViewResponse }) => {
    const { t } = useTranslation();
    if (tickets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    padding: '40px 20px', textAlign: 'center', minHeight: 'calc(100vh - 180px)', paddingBottom: '100px'
                }}
            >
                <img
                    src={historyEmptyIcon}
                    alt="No History"
                    style={{
                        width: '120px', height: '120px',
                        marginBottom: '16px', objectFit: 'contain'
                    }}
                />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1F293B', marginBottom: '8px' }}>
                    {t('trips.no_history')}
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280' }}>
                    {t('trips.history_empty_sub')}
                </p>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {tickets.map(ticket => (
                <HistoryTicketItem key={ticket.ticketId} ticket={ticket} onClick={() => onViewResponse(ticket)} />
            ))}
        </div>
    );
};

const HistoryTicketItem = ({ ticket, onClick }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const isCancelled = ticket.status === 'cancelled';

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.light(); onClick(); }}
            style={{
                backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '16px',
                border: '1px solid #E5E7EB',
                display: 'flex', flexDirection: 'column', gap: '12px',
                opacity: 0.8 // Light grey style
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F3F4F6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {ticket.transport === 'Bus' ? <img src={busIconNew} width={24} alt="Bus" style={{ filter: 'grayscale(100%)' }} /> : <Train size={24} color="#94A3B8" />}
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#374155' }}>
                            {ticket.route.replace('→', '➝')}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                            {new Date(ticket.creationTime).toLocaleDateString()} • {new Date(ticket.creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
                <div style={{
                    padding: '4px 8px', borderRadius: '6px',
                    backgroundColor: isCancelled ? '#FEF2F2' : '#F3F4F6',
                    color: isCancelled ? '#B91C1C' : '#64748B',
                    fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                }}>
                    {isCancelled ? t('trips.cancelled') : t('trips.completed')}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748B' }}>
                    {ticket.passengerCount || 1} {(ticket.passengerCount || 1) > 1 ? t('trips.passengers') : t('trips.passenger')}
                </span>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#374155' }}>
                    ₹{ticket.fare}
                </span>
            </div>
        </motion.div>
    );
};

// Full Details Modal for History
const HistoryTicketModal = ({ ticket, onClose }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 60,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px'
        }} onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                    backgroundColor: '#FFFFFF', width: '100%', maxWidth: '360px',
                    borderRadius: '24px', overflow: 'hidden', padding: '24px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F293B', marginBottom: '4px' }}>{t('trips.details_title')}</h2>
                    <p style={{ fontSize: '14px', color: '#6B7280' }}>
                        {new Date(ticket.creationTime).toLocaleDateString()}
                    </p>
                </div>

                {/* QR Code Container (Watermarked) */}
                <div style={{
                    position: 'relative', padding: '20px', backgroundColor: '#F9FAFB',
                    borderRadius: '16px', display: 'flex', justifyContent: 'center', marginBottom: '24px',
                    overflow: 'hidden'
                }}>
                    <QRCodeSVG value={ticket.ticketId} size={120} fgColor="#9CA3AF" />
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'grayscale(1)'
                    }}>
                        <span style={{
                            transform: 'rotate(-45deg)', fontSize: '20px', fontWeight: 600,
                            color: 'rgba(0,0,0,0.2)', pointerEvents: 'none'
                        }}>
                            {ticket.status === 'cancelled' ? t('trips.cancelled').toUpperCase() : t('trips.expired').toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>{t('trips.ticket_id')}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F293B' }}>{ticket.ticketId}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>{t('trips.route')}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#1F293B', textAlign: isRTL ? 'left' : 'right', maxWidth: '180px' }}>
                            {ticket.route}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>{t('trips.total_paid')}</span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F293B' }}>₹{ticket.fare}</span>
                    </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', padding: '14px',
                            backgroundColor: '#F3F4F6', color: '#374151',
                            borderRadius: '12px', border: 'none',
                            fontWeight: '600', fontSize: '15px'
                        }}
                    >
                        {t('trips.close')}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default YourTripsScreen;
