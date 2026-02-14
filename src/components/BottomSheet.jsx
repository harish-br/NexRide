import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useDragControls } from 'framer-motion';
import JourneyCard from './JourneyCard';
import { ArrowLeft } from 'lucide-react';
import TransportModeRow from './TransportModeRow';
import RouteOptionsList from './RouteOptionsList';
import NextArrivals from './NextArrivals';
import GuestSelectionScreen from './GuestSelectionScreen';

import TicketScreen from './TicketScreen';
import RouteCard from './RouteCard';
import UnderDevelopmentRoutes from './UnderDevelopmentRoutes';
import paymentService from '../services/paymentService';
import haptics from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { useLanguage } from './LanguageContext';

const BottomSheet = ({
    sheetState,
    setSheetState,
    dragY,
    setIsDragging,
    onStartSearch,
    routeData,
    routeStats,
    onClearRoute,
    selectedRouteIndex,
    setSelectedRouteIndex,
    onBusClick,
    onTrainClick,
    onNearbyClick,
    userAddress,
    userPosition,
    userDistrictInfo,
    onLegalNavigate,
    onTicketBooked
}) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const controls = useAnimation();
    const y = dragY || useMotionValue(0);
    const dragControls = useDragControls();

    const [isTicketVisible, setIsTicketVisible] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle' | 'success' | 'failure'

    // Guest Selection State
    const [isGuestSelectionVisible, setIsGuestSelectionVisible] = useState(false);
    const [ticketMeta, setTicketMeta] = useState({ count: 1, totalFare: null });

    const contentRef = useRef(null);

    const handleContentPointerDown = (e) => {
        const isAtTop = contentRef.current ? contentRef.current.scrollTop <= 0 : true;

        // If sheet is not expanded, or we are at the top of content, allow dragging the sheet
        if (sheetState !== 'expanded' || isAtTop) {
            dragControls.start(e);
        }
    };

    const handleStartJourney = () => {
        // Open Guest Selection First
        setIsGuestSelectionVisible(true);
        setSheetState('collapsed');
    };

    const handleGuestContinue = (count, totalFare) => {
        setTicketMeta({ count, totalFare });
        setIsGuestSelectionVisible(false);
        setIsTicketVisible(true);
    };

    // ... rest of the component logic ...
    // (Skipping to the onProceedPayment part for brevity in replacement, 
    // but the tool requires the full block if not using start/end correctly.
    // I will use multi_replace if I need to change disparate parts, 
    // but here I'll just replace the whole component body or use specific chunks.)

    /* ---------------- CONSTANTS ---------------- */

    const DEFAULT_VISIBLE_HEIGHT = 358;
    const EXPANDED_TOP_GAP = 50;

    const [snapPoints, setSnapPoints] = useState({
        expanded: EXPANDED_TOP_GAP,
        mid: window.innerHeight / 2,
        collapsed: window.innerHeight - DEFAULT_VISIBLE_HEIGHT
    });

    /* ---------------- CALCULATE SNAP POINTS ---------------- */

    useEffect(() => {
        const h = window.innerHeight;
        const collapsedY = h - DEFAULT_VISIBLE_HEIGHT;
        const midY = h * 0.55; // Slightly below middle for better feel
        const expandedY = EXPANDED_TOP_GAP;

        setSnapPoints({
            expanded: expandedY,
            mid: midY,
            collapsed: collapsedY
        });

        // Initialize position
        y.set(collapsedY);
        controls.set({ y: collapsedY });
    }, []);

    /* ---------------- DRAG END LOGIC ---------------- */

    const handleDragEnd = async (_, info) => {
        setIsDragging(false);

        const currentY = y.get();
        const velocityY = info.velocity.y;
        const { expanded, mid, collapsed } = snapPoints;

        let targetY = collapsed;

        // Snapping logic with 3 points and velocity awareness
        if (velocityY > 500) {
            // Strong swipe down
            if (currentY < mid - 20) targetY = mid;
            else targetY = collapsed;
        } else if (velocityY < -500) {
            // Strong swipe up
            if (currentY > mid + 20) targetY = mid;
            else targetY = expanded;
        } else {
            // Slow drag - snap to nearest
            const distExpanded = Math.abs(currentY - expanded);
            const distMid = Math.abs(currentY - mid);
            const distCollapsed = Math.abs(currentY - collapsed);

            const minDist = Math.min(distExpanded, distMid, distCollapsed);

            if (minDist === distExpanded) targetY = expanded;
            else if (minDist === distMid) targetY = mid;
            else targetY = collapsed;
        }

        // Update state
        if (targetY === expanded) setSheetState('expanded');
        else if (targetY === mid) setSheetState('mid');
        else setSheetState('collapsed');

        await controls.start({
            y: targetY,
            transition: {
                type: 'spring',
                stiffness: 250,
                damping: 30,
                velocity: velocityY,
                restDelta: 0.5
            }
        });
    };

    /* ---------------- RENDER ---------------- */

    return (
        <>
            <motion.div
                animate={controls}
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{
                    top: snapPoints.expanded,
                    bottom: snapPoints.collapsed
                }}
                dragElastic={0.1}
                dragMomentum={false}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '100vh',
                    background: '#fff',
                    borderRadius: '32px 32px 0 0',
                    boxShadow: '0 -6px 30px rgba(0,0,0,0.12)',
                    zIndex: 20,
                    y
                }}
            >
                {/* DRAG HANDLE */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 40,
                        background: '#fff',
                        borderRadius: '32px 32px 0 0',
                        zIndex: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        touchAction: 'none'
                    }}
                >
                    <div
                        style={{
                            width: 36,
                            height: 5,
                            background: '#D1D5DB',
                            borderRadius: 999,
                            opacity: 0.8
                        }}
                    />
                </div>

                <div
                    ref={contentRef}
                    onPointerDown={handleContentPointerDown}
                    style={{
                        padding: '24px 24px 160px', // Adjusted to 160px to clear Bottom Nav (80px) + Sheet Offset (50px) + Buffer
                        height: '100%',
                        overflowY: sheetState === 'expanded' ? 'auto' : 'hidden',
                        boxSizing: 'border-box',
                        touchAction: sheetState === 'expanded' ? 'pan-y' : 'none'
                    }}
                >
                    {routeData ? (
                        <UnderDevelopmentRoutes onBack={onClearRoute} />
                    ) : (
                        <>
                            <div style={{ padding: '0 4px', marginBottom: '16px' }}>
                            </div>

                            <JourneyCard onClick={onStartSearch} userAddress={userAddress} />
                            <TransportModeRow
                                onBusClick={onBusClick}
                                onTrainClick={onTrainClick}
                                onSuburbanClick={null}
                                onNearbyClick={onNearbyClick}
                            />
                            <NextArrivals userAddress={userAddress} userPosition={userPosition} userDistrictInfo={userDistrictInfo} />

                            {/* Minimal Branding Footer */}
                            <div style={{
                                padding: '32px 20px 0px',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '16px'
                            }}>
                                <div style={{ fontSize: '13px', color: '#6B7280', fontWeight: '500' }}>
                                    {t('common.made_with_love')}
                                </div>
                                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                    {t('common.copyright', { year: new Date().getFullYear() })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>

            <GuestSelectionScreen
                isVisible={isGuestSelectionVisible}
                onClose={() => setIsGuestSelectionVisible(false)}
                onContinue={handleGuestContinue}
                routeData={routeData ? { ...routeData, ...routeStats } : null}
                selectedRoute={{
                    type: (selectedRouteIndex === 1 || selectedRouteIndex === 3) ? 'train' : 'bus',
                    routeNumber: 'N/A',
                    isGovt: selectedRouteIndex === 0
                }}
            />

            <TicketScreen
                isVisible={isTicketVisible}
                onClose={() => setIsTicketVisible(false)}
                routeData={{ ...routeData, ...routeStats }}
                selectedRoute={{
                    type: (selectedRouteIndex === 1 || selectedRouteIndex === 3) ? 'train' : 'bus',
                    routeNumber: 'N/A',
                    isGovt: selectedRouteIndex === 0
                }}
                overrideFare={ticketMeta.totalFare}
                passengerCount={ticketMeta.count}
                onProceedPayment={async (fare) => {
                    if (!fare) return;

                    setIsProcessingPayment(true);
                    setPaymentStatus('idle');
                    console.log("[BottomSheet] Starting payment for fare:", fare);

                    // --- SAVE PENDING TICKET DATA ---
                    const pendingTicket = {
                        origin: routeData.origin?.name || routeData.origin, // handle object or string
                        destination: routeData.destination?.name || routeData.destination,
                        fare: ticketMeta.totalFare || fare,
                        passengers: ticketMeta.count,
                        busType: (selectedRouteIndex === 1 || selectedRouteIndex === 3) ? 'Train' : 'Bus', // Simple mapping for now
                        routeId: routeData.routeId || 'ROUTE_NA', // Fallback if no ID
                        durationString: routeStats?.duration || '2 hr', // For ETA calc in App.jsx
                    };
                    localStorage.setItem('pendingTicket', JSON.stringify(pendingTicket));
                    console.log("[BottomSheet] Pending ticket saved:", pendingTicket);
                    // --------------------------------

                    try {
                        // Create order
                        const sessionId = await paymentService.createOrder(fare);
                        console.log("[BottomSheet] Session created:", sessionId);

                        // Redirect to Cashfree
                        await paymentService.doPayment(sessionId);

                        // Note: Page will redirect to Cashfree, so we don't clear loading state here
                    } catch (error) {
                        console.error("[BottomSheet] Payment failed:", error);
                        setIsProcessingPayment(false);
                        setPaymentStatus('failure');
                        console.error(`Payment Error: ${error.message}`);
                    }
                }}
                isLoading={isProcessingPayment}
                paymentStatus={paymentStatus}
            />
        </>
    );
};

export default BottomSheet;