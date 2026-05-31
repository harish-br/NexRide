import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { suburbanTrains, searchSuburbanTrains } from '../data/suburbanTrains';
import haptics from '../utils/haptics';

// ─────────────────────────────────────────────────────────────────
// Time Helpers
// ─────────────────────────────────────────────────────────────────

// Parse "HH:MM" or "HH:MM / HH:MM" → minutes since midnight (use first time)
const parseTrainMinutes = (timeStr) => {
    if (!timeStr) return null;
    const part = timeStr.split('/')[0].trim(); // handle "07:15 / 07:30"
    const [h, m] = part.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
};

// Returns 'upcoming' | 'current' | 'past'
const getTrainStatus = (train, nowMinutes) => {
    const raw = train.departureTime || train.arrivalTime;
    const scheduled = parseTrainMinutes(raw);
    if (scheduled === null) return 'upcoming'; // no time → show normally
    const diff = scheduled - nowMinutes; // positive = in future
    if (diff >= -3) return diff <= 3 ? 'current' : 'upcoming';
    return 'past';
};

// Sort key: upcoming (by time asc) → current → past (by time asc)
const sortTrains = (trains, nowMinutes) => {
    const withStatus = trains.map(t => {
        const raw = t.departureTime || t.arrivalTime;
        const mins = parseTrainMinutes(raw);
        const status = getTrainStatus(t, nowMinutes);
        return { ...t, _mins: mins ?? 9999, _status: status };
    });
    const order = { upcoming: 0, current: 1, past: 2 };
    return withStatus.sort((a, b) => {
        const od = order[a._status] - order[b._status];
        if (od !== 0) return od;
        return a._mins - b._mins;
    });
};

// ─────────────────────────────────────────────────────────────────
// MEMU Detail Modal (bottom sheet)
// ─────────────────────────────────────────────────────────────────
const MEMUDetailModal = ({ train, onClose }) => {
    if (!train) return null;
    const hasDepart = !!train.departureTime;
    const hasArrive = !!train.arrivalTime;
    const hasAlt    = !!train.departureTimeAlt;

    return (
        <AnimatePresence>
            <motion.div
                key="memu-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                    zIndex: 4000, display: 'flex', alignItems: 'flex-end'
                }}
            >
                <motion.div
                    key="memu-sheet"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%',
                        background: 'white',
                        borderTopLeftRadius: 28,
                        borderTopRightRadius: 28,
                        padding: '24px 24px 44px',
                        boxShadow: '0 -12px 48px rgba(0,0,0,0.22)',
                    }}
                >
                    {/* Drag handle */}
                    <div style={{ width: 40, height: 4, borderRadius: 999, background: '#D1D5DB', margin: '0 auto 20px' }} />

                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{
                                    background: '#1E3A5F', color: 'white',
                                    fontSize: 13, fontWeight: 700, padding: '4px 10px', borderRadius: 6, letterSpacing: 0.5
                                }}>
                                    {train.trainNumber}
                                </span>
                                <span style={{
                                    background: '#FEF9C3', color: '#B45309',
                                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, letterSpacing: 0.5
                                }}>
                                    MEMU
                                </span>
                                {train.days?.includes('DAILY') && (
                                    <span style={{
                                        background: '#F0FDF4', color: '#16A34A',
                                        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20
                                    }}>
                                        DAILY
                                    </span>
                                )}
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                                {train.trainName}
                            </div>
                        </div>
                        <button onClick={onClose} style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#F3F4F6', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                            <X size={18} color="#6B7280" />
                        </button>
                    </div>

                    {/* Route card */}
                    <div style={{ background: '#F8FAFC', borderRadius: 18, padding: '18px 20px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {/* From */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 }}>FROM</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{train.from}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>{train.fromCode}</div>
                                {hasDepart && (
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>
                                        {train.departureTime}
                                        {hasAlt && <span style={{ fontSize: 15, color: '#6B7280', fontWeight: 600 }}> / {train.departureTimeAlt}</span>}
                                    </div>
                                )}
                                {!hasDepart && (
                                    <div style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>DEP: TBD</div>
                                )}
                            </div>

                            {/* Centre arrow */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
                                <div style={{
                                    width: 34, height: 34, borderRadius: '50%',
                                    background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <ArrowRight size={17} color="#3B82F6" />
                                </div>
                                <div style={{ width: 1, height: 24, background: '#E5E7EB' }} />
                            </div>

                            {/* To */}
                            <div style={{ flex: 1, textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginBottom: 2, letterSpacing: 0.5 }}>TO</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>{train.to}</div>
                                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>{train.toCode}</div>
                                {hasArrive && (
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#DC2626' }}>
                                        {train.arrivalTime}
                                    </div>
                                )}
                                {!hasArrive && (
                                    <div style={{ fontSize: 13, color: '#D1D5DB', fontWeight: 600 }}>ARR: TBD</div>
                                )}
                            </div>
                        </div>

                        {/* Via */}
                        {train.via && (
                            <div style={{
                                marginTop: 14, paddingTop: 12,
                                borderTop: '1px dashed #E5E7EB',
                                fontSize: 13, color: '#6B7280', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: 6
                            }}>
                                <MapPin size={13} color="#9CA3AF" />
                                Via {train.via}
                            </div>
                        )}
                    </div>

                    {/* Info grid */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <div style={{ flex: 1, background: '#F0FDF4', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, marginBottom: 4 }}>RUNS</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                                {train.days?.join(', ') || 'DAILY'}
                            </div>
                        </div>
                        <div style={{ flex: 1, background: '#EFF6FF', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: '#3B82F6', fontWeight: 700, marginBottom: 4 }}>PLATFORM</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                                {train.platform !== null && train.platform !== undefined ? `PF ${train.platform}` : 'TBD'}
                            </div>
                        </div>
                        <div style={{ flex: 1, background: '#FFF7ED', borderRadius: 12, padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: '#EA580C', fontWeight: 700, marginBottom: 4 }}>LIVE</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Soon</div>
                        </div>
                    </div>

                    {/* Notes */}
                    {train.notes ? (
                        <div style={{
                            background: '#FFFBEB', border: '1px solid #FDE68A',
                            borderRadius: 12, padding: '10px 14px',
                            fontSize: 13, color: '#92400E', fontWeight: 500
                        }}>
                            ℹ️ {train.notes}
                        </div>
                    ) : null}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ─────────────────────────────────────────────────────────────────
// Commuter Rail Icon (Material Symbols: commuter_rail style)
// ─────────────────────────────────────────────────────────────────
const CommuterRailIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
        {/* Main body */}
        <rect x="2" y="5" width="20" height="12" rx="2" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5"/>
        {/* Cab nose */}
        <path d="M2 7 Q2 5 4 5 L7 5 L7 11 L2 11 Z" fill="white" fillOpacity="0.9"/>
        {/* Front window */}
        <rect x="2.5" y="6" width="3.5" height="3.5" rx="0.5" fill="#2563EB"/>
        {/* Side windows row */}
        <rect x="8.5" y="7" width="3" height="3" rx="0.6" fill="white" fillOpacity="0.85"/>
        <rect x="13" y="7" width="3" height="3" rx="0.6" fill="white" fillOpacity="0.85"/>
        <rect x="17.5" y="7" width="2.5" height="3" rx="0.6" fill="white" fillOpacity="0.85"/>
        {/* Stripe line */}
        <line x1="2" y1="12.5" x2="22" y2="12.5" stroke="white" strokeWidth="1" strokeOpacity="0.4"/>
        {/* Wheels */}
        <circle cx="6" cy="18.5" r="1.8" fill="white"/>
        <circle cx="12" cy="18.5" r="1.8" fill="white"/>
        <circle cx="18" cy="18.5" r="1.8" fill="white"/>
        {/* Undercarriage */}
        <line x1="3" y1="17" x2="21" y2="17" stroke="white" strokeWidth="1.2" strokeOpacity="0.6"/>
    </svg>
);

// ─────────────────────────────────────────────────────────────────
// MEMU Train Card
// ─────────────────────────────────────────────────────────────────
const MEMUCard = ({ train, status = 'upcoming', onClick }) => {
    const rawTime = train.departureTime || train.arrivalTime;
    // Primary display time (first part if combined e.g. "07:15 / 07:30")
    const displayTime = rawTime ? rawTime.split('/')[0].trim() : '--:--';
    const isDepart = !!train.departureTime;
    const isPast = status === 'past';
    const isCurrent = status === 'current';

    const timeColor = isPast ? '#9CA3AF' : isCurrent ? '#F59E0B' : '#16A34A';

    return (
        <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            style={{
                background: isPast ? '#FAFAFA' : 'white',
                borderRadius: 18,
                padding: '14px 16px',
                marginBottom: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: `1px solid ${isPast ? '#F3F4F6' : '#F3F4F6'}`,
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer',
                opacity: isPast ? 0.72 : 1,
            }}
        >
            {/* Icon — same image as Suburban tab on home screen */}
            <img
                src="/icons/metro_3d.jpg"
                alt="Suburban train"
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    objectFit: 'contain',
                    flexShrink: 0,
                    opacity: isPast ? 0.45 : 1,
                }}
            />

            {/* Route info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                        fontSize: 11, fontWeight: 700, color: '#374151',
                        background: '#F3F4F6', padding: '2px 7px', borderRadius: 5
                    }}>{train.trainNumber}</span>
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: '#B45309',
                        background: '#FEF9C3', padding: '2px 6px', borderRadius: 20
                    }}>MEMU</span>
                    {isCurrent && (
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: '#92400E',
                            background: '#FEF3C7', padding: '2px 6px', borderRadius: 20
                        }}>NOW</span>
                    )}
                </div>
                <div style={{
                    fontSize: 14, fontWeight: 700, color: isPast ? '#9CA3AF' : '#111827',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                }}>
                    {train.from} <span style={{ color: '#D1D5DB', fontWeight: 400 }}>→</span> {train.to}
                </div>
                {train.via ? (
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginTop: 1 }}>
                        via {train.via}
                    </div>
                ) : null}
            </div>

            {/* Time display */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {isPast ? (
                    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, lineHeight: 1.4, textAlign: 'right' }}>
                        <div style={{ marginBottom: 1 }}>Runs at</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{displayTime}</div>
                        <div>schedule</div>
                    </div>
                ) : (
                    <>
                        <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 1 }}>
                            {isDepart ? 'DEP' : 'ARR'}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: timeColor }}>
                            {displayTime}
                        </div>
                    </>
                )}
            </div>
            <ChevronRight size={16} color="#D1D5DB" style={{ flexShrink: 0 }} />
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────────────
// Main SuburbanSheet Component
// ─────────────────────────────────────────────────────────────────
const SuburbanSheet = ({ isOpen, onClose }) => {
    const [search, setSearch] = useState('');
    const [selectedTrain, setSelectedTrain] = useState(null);
    const [nowMinutes, setNowMinutes] = useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });

    // Refresh time every 60 seconds
    useEffect(() => {
        const tick = () => {
            const n = new Date();
            setNowMinutes(n.getHours() * 60 + n.getMinutes());
        };
        const id = setInterval(tick, 60_000);
        return () => clearInterval(id);
    }, []);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setSearch('');
            setSelectedTrain(null);
        }
    }, [isOpen]);

    const baseList = search.trim().length >= 2
        ? searchSuburbanTrains(search)
        : suburbanTrains;

    // Sort by time status: upcoming → current → past
    const sortedTrains = sortTrains(baseList, nowMinutes);

    const handleClose = () => {
        haptics.light();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(3px)',
                            zIndex: 3000
                        }}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: '0%' }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        style={{
                            position: 'fixed', left: 0, right: 0, bottom: 0,
                            height: '92vh',
                            background: '#F9FAFB',
                            borderTopLeftRadius: 28, borderTopRightRadius: 28,
                            zIndex: 3001,
                            display: 'flex', flexDirection: 'column',
                            boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px 20px 16px',
                            background: 'white',
                            borderBottom: '1px solid #F3F4F6',
                            borderTopLeftRadius: 28, borderTopRightRadius: 28,
                            flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                <button
                                    onClick={handleClose}
                                    style={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        background: '#F3F4F6', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                                    }}
                                >
                                    <ArrowLeft size={20} color="#374151" />
                                </button>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: 0 }}>
                                        Suburban Trains
                                    </h2>
                                    <p style={{ fontSize: 13, color: '#9CA3AF', margin: '2px 0 0', fontWeight: 500 }}>
                                        MEMU services — Erode region
                                    </p>
                                </div>
                                <span style={{
                                    background: '#FEF9C3', color: '#B45309',
                                    fontSize: 12, fontWeight: 700,
                                    padding: '5px 11px', borderRadius: 20
                                }}>
                                    {suburbanTrains.length} trains
                                </span>
                            </div>

                            {/* Search */}
                            <div style={{
                                background: '#F3F4F6', borderRadius: 14,
                                padding: '11px 14px',
                                display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                                <Search size={16} color="#9CA3AF" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by station, route or train..."
                                    style={{
                                        flex: 1, border: 'none', background: 'transparent',
                                        fontSize: 15, fontWeight: 500, color: '#111',
                                        outline: 'none', padding: 0
                                    }}
                                />
                                {search ? (
                                    <button
                                        onClick={() => setSearch('')}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        <X size={16} color="#9CA3AF" />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Scrollable list */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>

                            {/* Section label */}
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', marginBottom: 12, letterSpacing: 0.5 }}>
                                {search.trim().length >= 2
                                    ? `${sortedTrains.length} result${sortedTrains.length !== 1 ? 's' : ''} for "${search}"`
                                    : 'ALL MEMU SCHEDULES'}
                            </div>

                            {sortedTrains.length === 0 ? (
                                <div style={{
                                    textAlign: 'center', padding: '60px 24px',
                                    color: '#9CA3AF', fontSize: 14
                                }}>
                                    No trains found for "{search}"
                                </div>
                            ) : (
                                sortedTrains.map((train, i) => (
                                    <MEMUCard
                                        key={train.trainNumber + i}
                                        train={train}
                                        status={train._status}
                                        onClick={() => { haptics.light(); setSelectedTrain(train); }}
                                    />
                                ))
                            )}

                            {/* Footer */}
                            <div style={{
                                textAlign: 'center', marginTop: 16,
                                fontSize: 11, color: '#D1D5DB', fontWeight: 500
                            }}>
                                Real-time status · Platform info · Intermediate stops — coming soon
                            </div>
                        </div>
                    </motion.div>

                    {/* Detail modal rendered on top */}
                    {selectedTrain && (
                        <MEMUDetailModal
                            train={selectedTrain}
                            onClose={() => setSelectedTrain(null)}
                        />
                    )}
                </>
            )}
        </AnimatePresence>
    );
};

export default SuburbanSheet;
