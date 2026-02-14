import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation, useMotionValue, useDragControls } from 'framer-motion';

const RideBottomSheet = ({
    children,
    sheetState,
    setSheetState,
    snapPoints: customSnapPoints,
    footer // NEW: Fixed footer element
}) => {
    const controls = useAnimation();
    const dragControls = useDragControls();
    const y = useMotionValue(window.innerHeight);
    const contentRef = useRef(null);

    const DEFAULT_VISIBLE_HEIGHT = 350;
    const EXPANDED_TOP_GAP = 60;

    const [snapPoints, setSnapPoints] = useState(customSnapPoints || {
        expanded: EXPANDED_TOP_GAP,
        mid: window.innerHeight * 0.5,
        collapsed: window.innerHeight - DEFAULT_VISIBLE_HEIGHT
    });

    useEffect(() => {
        const h = window.innerHeight;
        const collapsedY = h - DEFAULT_VISIBLE_HEIGHT;
        const midY = h * 0.55;
        const expandedY = EXPANDED_TOP_GAP;

        const points = {
            expanded: expandedY,
            mid: midY,
            collapsed: collapsedY
        };
        setSnapPoints(points);

        // Initial position
        const initialY = sheetState === 'expanded' ? expandedY : (sheetState === 'mid' ? midY : collapsedY);
        y.set(initialY);
        controls.set({ y: initialY });
    }, [sheetState]);

    const handleContentPointerDown = (e) => {
        const isAtTop = contentRef.current ? contentRef.current.scrollTop <= 0 : true;
        if (sheetState !== 'expanded' || isAtTop) {
            dragControls.start(e);
        }
    };

    const handleDragEnd = async (_, info) => {
        const currentY = y.get();
        const velocityY = info.velocity.y;
        const { expanded, mid, collapsed } = snapPoints;

        let targetY = collapsed;

        if (velocityY > 500) {
            // Strong swipe down - go to next snap point below
            if (currentY < mid - 20) targetY = mid;
            else targetY = collapsed;
        } else if (velocityY < -500) {
            // Strong swipe up - go to next snap point above
            if (currentY > mid + 20) targetY = mid;
            else targetY = expanded;
        } else {
            // Slow drag or small flick - snap to nearest
            const distExpanded = Math.abs(currentY - expanded);
            const distMid = Math.abs(currentY - mid);
            const distCollapsed = Math.abs(currentY - collapsed);
            const minDist = Math.min(distExpanded, distMid, distCollapsed);

            if (minDist === distExpanded) targetY = expanded;
            else if (minDist === distMid) targetY = mid;
            else targetY = collapsed;
        }

        if (targetY === expanded) setSheetState('expanded');
        else if (targetY === mid) setSheetState('mid');
        else setSheetState('collapsed');

        await controls.start({
            y: targetY,
            transition: {
                type: 'spring',
                stiffness: 250,
                damping: 30,
                mass: 0.8,
                velocity: velocityY, // Carry over momentum
                restDelta: 0.5
            }
        });
    };

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
                dragElastic={0.05}
                dragMomentum={true}
                onDragEnd={handleDragEnd}
                style={{
                    position: 'fixed',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: '100vh',
                    background: '#fff',
                    borderRadius: '24px 24px 0 0',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
                    zIndex: 150,
                    y,
                    display: sheetState === 'hidden' ? 'none' : 'block'
                }}
            >
                {/* DRAG HANDLE */}
                <div
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{
                        height: '24px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        touchAction: 'none'
                    }}
                >
                    <div style={{ width: '40px', height: '4px', background: '#E5E7EB', borderRadius: '2px' }} />
                </div>

                <div
                    ref={contentRef}
                    onPointerDown={handleContentPointerDown}
                    style={{
                        height: 'calc(100% - 24px)', // Deduct handle height
                        overflowY: sheetState === 'expanded' ? 'auto' : 'hidden',
                        touchAction: sheetState === 'expanded' ? 'pan-y' : 'none',
                        padding: '0 24px 140px' // Increased bottom padding to accommodate fixed footer
                    }}
                >
                    {children}
                </div>
            </motion.div>

            {/* FIXED FOOTER (Outside the draggable sheet, but same visibility logic) */}
            {footer && sheetState !== 'hidden' && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 160, // Above sheet
                    padding: '24px',
                    background: 'linear-gradient(to top, white 80%, rgba(255,255,255,0))', // Gradient fade
                    pointerEvents: 'auto'
                }}>
                    {footer}
                </div>
            )}
        </>
    );
};

export default RideBottomSheet;
