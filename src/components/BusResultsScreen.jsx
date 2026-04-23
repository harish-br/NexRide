import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { busSchedules } from '../data/busSchedules';
import busIconImg from '../assets/bus_hero_final.png';
import trainIconImg from '../assets/train_hero_final.png';

import { normalizePlace } from '../utils/busSearchUtils';
import ASMBookingModal from './ASMBookingModal';

const BusResultsScreen = ({ onBack, searchData, filterState, setFilterState }) => {
    // searchData: { from, to }

    // Use lifted state
    const sortBy = filterState?.sortBy || 'earliest';
    const filterType = filterState?.filterType || 'All';

    // Helpers to update lifted state
    const setSortBy = (val) => {
        const newVal = typeof val === 'function' ? val(sortBy) : val;
        setFilterState(prev => ({ ...prev, sortBy: newVal }));
    };

    const setFilterType = (val) => {
        const newVal = typeof val === 'function' ? val(filterType) : val;
        setFilterState(prev => ({ ...prev, filterType: newVal }));
    };

    const [currentTime, setCurrentTime] = useState(new Date());
    const [selectedAsmBus, setSelectedAsmBus] = useState(null);
    const listRef = React.useRef(null);

    // RESTORE SCROLL POSITION Logic
    // We utilize valid HTML DOM methods to restore scroll
    React.useLayoutEffect(() => {
        if (listRef.current && filterState?.scrollPosition) {
            listRef.current.scrollTop = filterState.scrollPosition;
        }
    }, []); // Run once on mount

    // SAVE SCROLL POSITION Logic
    useEffect(() => {
        return () => {
            if (listRef.current) {
                const pos = listRef.current.scrollTop;
                setFilterState(prev => ({ ...prev, scrollPosition: pos }));
            }
        };
    }, []);

    // Auto Refresh every 60s
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const filteredBuses = useMemo(() => {
        if (!searchData) return [];

        const source = searchData.from;
        const dest = searchData.to;

        const fromQuery = normalizePlace(source).toLowerCase();
        const toQuery = normalizePlace(dest).toLowerCase();

        // Prepare current time in minutes for comparison
        const currentHours = currentTime.getHours();
        const currentMinutes = currentTime.getMinutes();
        const currentTotalMinutes = currentHours * 60 + currentMinutes;

        // Helper to convert time "04:45 AM" to minutes
        const toMinutes = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        };

        // Filter by route
        let results = busSchedules.filter(bus => {
            const busFrom = normalizePlace(bus.from).toLowerCase();
            const busTo = normalizePlace(bus.to).toLowerCase();
            return busFrom === fromQuery && busTo === toQuery;
        });

        // TIME-AWARE FILTERING - Strictly hide past buses
        results = results.filter(bus => {
            const busTimeMinutes = toMinutes(bus.departureTime);
            return busTimeMinutes >= currentTotalMinutes;
        });

        // Filter by Type
        if (filterType !== 'All') {
            if (filterType === 'Govt') {
                results = results.filter(bus =>
                    bus.serviceType.toLowerCase().includes('govt') ||
                    bus.serviceType.toLowerCase().includes('tnstc')
                );
            } else if (filterType === 'Private') {
                results = results.filter(bus =>
                    bus.serviceType.toLowerCase() === 'private'
                );
            } else if (filterType === 'Non-Stop') {
                results = results.filter(bus =>
                    bus.serviceType.toLowerCase().includes('non-stop')
                );
            } else if (filterType === 'A.S.M') {
                results = results.filter(bus => bus.bus_type === 'A.S.M');
            }
        }

        // Sort
        results.sort((a, b) => {
            const timeA = toMinutes(a.departureTime);
            const timeB = toMinutes(b.departureTime);
            return sortBy === 'earliest' ? timeA - timeB : timeB - timeA;
        });

        return results;
    }, [searchData, filterType, sortBy, currentTime]); // Re-run when time changes

    return (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: '#F9FAFB',
                zIndex: 60,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header */}
            <div style={{
                background: 'white',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        marginRight: '16px',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={24} color="#111" />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#111' }}>
                            {searchData?.from || 'Source'}
                        </span>
                        <ArrowLeft size={16} color="#9CA3AF" style={{ transform: 'rotate(180deg)' }} />
                        <span style={{ fontSize: '18px', fontWeight: 600, color: '#111' }}>
                            {searchData?.to || 'Destination'}
                        </span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                        {filteredBuses.length} buses found
                    </span>
                </div>
            </div>

            {/* Filters & Sorthing */}
            <div style={{
                padding: '12px 20px',
                background: 'white',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                alignItems: 'center'
            }}>
                {/* Sort Button */}
                <button
                    onClick={() => setSortBy(prev => prev === 'earliest' ? 'latest' : 'earliest')}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#374151',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowUpDown size={14} />
                    {sortBy === 'earliest' ? 'Earliest' : 'Latest'}
                </button>

                <div style={{ width: '1px', height: '24px', background: '#E5E7EB', margin: '0 4px' }} />

                {/* Filter Chips */}
                {['All', 'Govt', 'Private', 'Non-Stop', 'A.S.M'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: filterType === type ? '1px solid #2563EB' : '1px solid #E5E7EB',
                            background: filterType === type ? '#EFF6FF' : 'white',
                            color: filterType === type ? '#2563EB' : '#4B5563',
                            fontSize: '13px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* List */}
            <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredBuses.length > 0 ? (
                        filteredBuses.map((bus, index) => {
                            // Determine icon type
                            const isTrain = bus.operatorName.toLowerCase().includes('train') || bus.serviceType.toLowerCase().includes('train');
                            const iconSrc = isTrain ? trainIconImg : busIconImg;

                            // Time Logic for Badges
                            const currentHours = currentTime.getHours();
                            const currentMinutes = currentTime.getMinutes();
                            const currentTotalMinutes = currentHours * 60 + currentMinutes;

                            const toMinutes = (timeStr) => {
                                const [time, period] = timeStr.split(' ');
                                let [hours, minutes] = time.split(':').map(Number);
                                if (period === 'PM' && hours !== 12) hours += 12;
                                if (period === 'AM' && hours === 12) hours = 0;
                                return hours * 60 + minutes;
                            };

                            const busTotalMinutes = toMinutes(bus.departureTime);
                            const diff = busTotalMinutes - currentTotalMinutes;

                            // LABEL RULES: First upcoming bus -> NOW, Following -> NEXT
                            const isNow = index === 0;
                            const isNext = index > 0;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        background: bus.bus_type === 'A.S.M' ? '#FFFBEB' : 'white',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        border: bus.bus_type === 'A.S.M' ? '1px solid #FCD34D' : '1px solid #F3F4F6',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        minHeight: '80px'
                                    }}
                                >
                                    {/* A.S.M Special Badge */}
                                    {bus.bus_type === 'A.S.M' && (
                                        <div style={{
                                            position: 'absolute', top: 0, left: '16px',
                                            background: '#F59E0B', color: 'white',
                                            padding: '2px 8px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px',
                                            fontSize: '10px', fontWeight: 'bold', zIndex: 5, letterSpacing: '0.02em', textTransform: 'uppercase'
                                        }}>
                                            A.S.M Special
                                        </div>
                                    )}

                                    {/* 3D Icon - Absolute Right */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '-20px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '100px',
                                        height: '75px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: 1,
                                        zIndex: 0,
                                        pointerEvents: 'none'
                                    }}>
                                        <img
                                            src={iconSrc}
                                            alt="Transport Mode"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain',
                                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                                            }}
                                        />
                                    </div>

                                    {/* Left: Time & Layout Container */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1, flex: 1 }}>

                                        {/* Status Tag Row - if applicable */}
                                        {(isNow || isNext) && (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {isNow && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        padding: '3px 6px',
                                                        borderRadius: '4px',
                                                        background: '#F3F4F6', // Neutral Grey/Greenish
                                                        color: '#15803D',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.02em',
                                                    }}>
                                                        Now
                                                    </span>
                                                )}
                                                {isNext && (
                                                    <span style={{
                                                        fontSize: '10px',
                                                        fontWeight: 600,
                                                        padding: '3px 6px',
                                                        borderRadius: '4px',
                                                        background: '#DBEAFE', // Light Blue
                                                        color: '#1E40AF',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.02em',
                                                    }}>
                                                        Next
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* Time & Operator */}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '20px', fontWeight: 600, color: '#111' }}>
                                                    {bus.departureTime}
                                                </span>
                                                <span style={{ fontSize: '13px', fontWeight: '600', color: '#6B7280' }}>
                                                    {bus.operatorName}
                                                </span>
                                            </div>

                                            {/* Vertical Divider */}
                                            <div style={{ width: '1px', height: '24px', background: '#E5E7EB' }} />

                                            {/* Service Type Tag Logic */}
                                            {(() => {
                                                const isGovt = bus.serviceType.toLowerCase().includes('govt') || bus.serviceType.toLowerCase().includes('tnstc');
                                                const isNonStop = bus.serviceType.toLowerCase().includes('non-stop');

                                                // Common Pill Style (for > 2 mins or non-next)
                                                const pillStyle = {
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    background: isGovt ? '#DCFCE7' : '#F3F4F6',
                                                    color: isGovt ? '#166534' : '#374151',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.02em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                };

                                                const clockIcon = (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <polyline points="12 6 12 12 16 14"></polyline>
                                                    </svg>
                                                );

                                                // NEXT BUS SPECIAL LAYOUT
                                                if (isNext) {
                                                    // "Now" case (<= 2 mins) -> Inline Text Tags
                                                    if (diff <= 2 && diff > -100) { // -100 safeguard
                                                        return (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '12px',
                                                                fontWeight: 600,
                                                                letterSpacing: '0.02em'
                                                            }}>
                                                                {/* NOW (Green) */}
                                                                <span style={{ color: '#166534' }}>NOW</span>

                                                                {/* Separator */}
                                                                <span style={{ color: '#D1D5DB', fontWeight: '400' }}>•</span>

                                                                {/* GOVT/PRIVATE (Grey) */}
                                                                <span style={{ color: '#6B7280', fontSize: '11px', fontWeight: 600 }}>
                                                                    {isGovt ? 'GOVT' : 'PRIVATE'}
                                                                </span>

                                                                {/* NON-STOP (Soft Green) */}
                                                                {isNonStop && (
                                                                    <>
                                                                        <span style={{ color: '#D1D5DB', fontWeight: '400' }}>•</span>
                                                                        <span style={{ color: '#166534', fontSize: '11px', fontWeight: 600 }}>
                                                                            NON-STOP
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    // If Next Bus but > 2 mins, fall through to Standard Layout (Single Pill) to avoid clutter
                                                }

                                                // STANDARD LAYOUT (Other buses or Next Bus > 2 mins)
                                                let badgeText = bus.serviceType.replace('TNSTC ', '');
                                                let showClock = false;

                                                if (diff <= 30 && diff > 0) {
                                                    if (diff <= 2) {
                                                        badgeText = "Arriving now";
                                                    } else if (diff <= 10) {
                                                        badgeText = `Leaving in ${diff} min`;
                                                        showClock = true;
                                                    } else {
                                                        badgeText = `Departs in ${diff} min`;
                                                        showClock = true;
                                                    }
                                                }

                                                return (
                                                    <span style={pillStyle}>
                                                        {showClock && clockIcon}
                                                        {badgeText}
                                                    </span>
                                                );
                                            })()}
                                            {bus.bus_type === 'A.S.M' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAsmBus(bus);
                                                    }}
                                                    style={{
                                                        background: '#F59E0B', color: 'white',
                                                        border: 'none', borderRadius: '100px',
                                                        padding: '4px 12px', fontSize: '12px', fontWeight: '600',
                                                        cursor: 'pointer', zIndex: 10, position: 'relative'
                                                    }}
                                                >
                                                    Book Now
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Spacer for Icon */}
                                    <div style={{ width: '60px' }}></div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
                                No more buses available today
                            </div>
                            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                                Try changing your search or checking nearby stops.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* A.S.M Booking Modal */}
            <ASMBookingModal 
                isOpen={!!selectedAsmBus} 
                onClose={() => setSelectedAsmBus(null)} 
                bus={selectedAsmBus} 
            />
        </div >
    );
};

export default BusResultsScreen;
