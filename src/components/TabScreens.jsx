import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { QRCodeSVG } from 'qrcode.react';
import coffeeBreakAnimation from './LottieAnimations/coffee-break.json';
import { motion, useMotionValue, AnimatePresence } from 'framer-motion';

// ------------------------------------------
// TICKETS SCREEN (STACKED UI)
// ------------------------------------------
export const TicketsScreen = () => {
    const [activeTickets, setActiveTickets] = useState([]);
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(i);
    }, []);

    useEffect(() => {
        const fetchTickets = () => {
            const all = JSON.parse(localStorage.getItem('tickets') || '[]');
            const valid = all.filter(t => t.expiryTime > Date.now());
            valid.sort((a, b) => b.creationTime - a.creationTime);
            setActiveTickets(valid);
        };
        fetchTickets();
        window.addEventListener('focus', fetchTickets);
        return () => window.removeEventListener('focus', fetchTickets);
    }, []);

    // Guidance State
    const [showGuide, setShowGuide] = useState(() => {
        return !sessionStorage.getItem('hasSeenSwipeGuide');
    });

    useEffect(() => {
        if (showGuide && activeTickets.length > 1) {
            const timer = setTimeout(() => {
                setShowGuide(false);
                sessionStorage.setItem('hasSeenSwipeGuide', 'true');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showGuide, activeTickets]);

    const rotateTickets = () => {
        if (showGuide) {
            setShowGuide(false);
            sessionStorage.setItem('hasSeenSwipeGuide', 'true');
        }
        setActiveTickets(prev => {
            if (prev.length < 2) return prev;
            const [first, ...rest] = prev;
            return [...rest, first];
        });
    };

    if (activeTickets.length === 0) {
        return (
            <div style={styles.emptyRoot}>
                <Lottie animationData={coffeeBreakAnimation} loop autoplay style={{ width: 180 }} />
                <h2 style={styles.emptyTitle}>No active ticket</h2>
                <p style={styles.emptySub}>Sit back, sip some coffee, and book when ready.</p>
            </div>
        );
    }

    return (
        <div style={styles.root}>
            <AnimatePresence>
                {showGuide && activeTickets.length > 1 && (
                    <SwipeGuide />
                )}
            </AnimatePresence>

            <div style={styles.stackContainer}>
                {activeTickets.map((ticket, index) => {
                    if (index > 2) return null;
                    return (
                        <TicketStackItem
                            key={ticket.ticketId}
                            ticket={ticket}
                            index={index}
                            now={now}
                            onSwipe={rotateTickets}
                            total={activeTickets.length}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// ------------------------------------------
// SWIPE GUIDE COMPONENT
// ------------------------------------------
const SwipeGuide = () => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        style={styles.guideWrapper}
    >
        <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={styles.guideInner}
        >
            <div style={styles.guideIcon}>↑</div>
            <div style={styles.guideText}>Swipe for more</div>
        </motion.div>
    </motion.div>
);

// ------------------------------------------
// STACK ITEM
// ------------------------------------------
const TicketStackItem = ({ ticket, index, now, onSwipe, total }) => {
    const isTop = index === 0;
    const y = useMotionValue(0);

    const yOffset = index * 14;
    const scale = 1 - index * 0.04;

    const handleDragEnd = (_, info) => {
        if (!isTop) return;
        if (info.offset.y < -50 || info.velocity.y < -400) {
            onSwipe();
        }
    };

    const diff = ticket.expiryTime - now;
    const h = Math.max(0, Math.floor(diff / 3600000));
    const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
    const s = Math.max(0, Math.floor((diff % 60000) / 1000));

    return (
        <motion.div
            style={{ ...styles.ticketWrapper, y, zIndex: 10 - index }}
            animate={{ scale, y: yOffset }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag={isTop && total > 1 ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.2, bottom: 0.05 }}
            onDragEnd={handleDragEnd}
        >
            <div style={styles.paperTicket}>
                <div style={styles.paperHeader}>
                    <div style={styles.brandName}>NexRide</div>
                    <div style={styles.ticketId}>ID: {ticket.ticketId}</div>
                </div>

                <Dash />

                <div style={{ textAlign: 'center' }}>
                    <div style={styles.stopLabel}>FROM</div>
                    <div style={styles.stopName}>{ticket.origin}</div>
                    <div style={{ margin: 6 }}>↓</div>
                    <div style={styles.stopLabel}>TO</div>
                    <div style={styles.stopName}>{ticket.destination}</div>
                </div>

                <Dash />

                <div style={styles.grid}>
                    <Detail label="DATE" value={new Date(ticket.creationTime).toLocaleDateString()} />
                    <Detail label="TIME" value={new Date(ticket.creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <Detail label="PASSENGERS" value={ticket.passengers} />
                    <Detail label="FARE" value={`₹${ticket.fare}`} highlight />
                </div>

                <div style={styles.busType}>{ticket.busType}</div>

                <Dash />

                <div style={styles.qrSection}>
                    <QRCodeSVG value={ticket.ticketId} size={120} />
                    <div style={styles.scanText}>Scan to verify</div>
                </div>

                <Dash />

                <div style={styles.footerActive}>
                    Valid for: {h}h {m}m {s}s
                </div>
            </div>
        </motion.div>
    );
};

// ------------------------------------------
// SMALL UI
// ------------------------------------------
const Dash = () => <div style={styles.dash} />;
const Detail = ({ label, value, highlight }) => (
    <div>
        <div style={styles.detailLabel}>{label}</div>
        <div style={{ ...styles.detailValue, fontSize: highlight ? 20 : 15 }}>{value}</div>
    </div>
);

// ------------------------------------------
// STYLES
// ------------------------------------------
const styles = {
    root: {
        position: 'fixed',
        inset: 0,
        background: '#2563EB',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // 🔥 ONLY CHANGE IS HERE
    stackContainer: {
        position: 'relative',
        width: '100%',
        maxWidth: '350px',
        height: '600px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transform: 'translateY(-35px)', // ✅ ticket raised
    },

    ticketWrapper: {
        position: 'absolute',
        width: '100%',
        maxWidth: '340px',
    },

    paperTicket: {
        background: '#FDFBF7',
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
    },

    paperHeader: { display: 'flex', justifyContent: 'space-between' },
    brandName: { fontSize: 20, fontWeight: 600 },
    ticketId: { fontSize: 11, color: '#6B7280' },

    stopLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 600 },
    stopName: { fontSize: 16, fontWeight: 600 },

    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },

    busType: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 12,
        background: '#F3F4F6',
        padding: 6,
        borderRadius: 999,
    },

    qrSection: { textAlign: 'center' },
    scanText: { fontSize: 10, marginTop: 6 },

    footerActive: {
        marginTop: 8,
        padding: 8,
        textAlign: 'center',
        background: '#ECFDF5',
        color: '#059669',
        fontWeight: 600,
        borderRadius: 8,
    },

    dash: {
        borderBottom: '2px dashed #D1D5DB',
        margin: '16px 0',
    },

    detailLabel: { fontSize: 10, color: '#6B7280', fontWeight: 600 },
    detailValue: { fontWeight: 600 },

    // Guidance Styles
    guideWrapper: {
        position: 'absolute',
        top: '12%', // Positioning above the stack
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
    },
    guideInner: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.15)', // Subtle pill background
        padding: '8px 16px',
        borderRadius: 24,
        backdropFilter: 'blur(4px)',
    },
    guideIcon: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 20,
        fontWeight: 600,
        lineHeight: 1,
        marginBottom: 2,
    },
    guideText: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase'
    },

    emptyRoot: {
        position: 'fixed',
        inset: 0,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: { fontSize: 24, fontWeight: 600 },
    emptySub: { fontSize: 14, color: '#6B7280' },
};

export default TicketsScreen;