import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import haptics from '../utils/haptics';

const NetworkStatusBanner = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [visible, setVisible] = useState(!navigator.onLine);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        const updateStatus = () => {
            const currentStatus = navigator.onLine;

            if (!currentStatus) { // Went offline
                setIsOnline(false);
                setShowSuccess(false);
                setVisible(true);
                haptics.medium(); // Notify user of drop
            } else { // Came back online
                setIsOnline(true);
                if (visible) { // Only show success if we were showing the offline banner
                    setShowSuccess(true);
                    haptics.success(); // Notify user of recovery
                    // Auto-hide success banner after 2.5 seconds
                    setTimeout(() => {
                        setVisible(false);
                        setTimeout(() => setShowSuccess(false), 400); // clear success state after animation ends
                    }, 2500);
                }
            }
        };

        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);

        // Initial check just in case
        updateStatus();

        return () => {
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
        };
    }, [visible]);

    const handleRefresh = async () => {
        haptics.light();

        if (!navigator.onLine) {
            haptics.medium();
            setLocalError('Still no internet connection');
            setTimeout(() => setLocalError(''), 2500);
            return;
        }

        setIsRefreshing(true);
        setLocalError('');

        try {
            // Actual verification ping to catch lie-fi
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });

            // Dispatch manual refresh to listeners
            window.dispatchEvent(new Event('app:manualRefresh'));

            setIsOnline(true);
            setVisible(true);
            setShowSuccess(true);
            haptics.success();

            setTimeout(() => {
                setVisible(false);
                setTimeout(() => setShowSuccess(false), 400);
            }, 2500);

        } catch (e) {
            haptics.medium();
            setLocalError('Failed to refresh data');
            setTimeout(() => setLocalError(''), 2500);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Push content below the banner dynamically so back buttons are never covered
    const BANNER_HEIGHT = 52; // px, approximate height of the banner
    useEffect(() => {
        const appRoot = document.getElementById('root');
        if (!appRoot) return;
        if (visible) {
            appRoot.style.paddingTop = `${BANNER_HEIGHT}px`;
        } else {
            appRoot.style.paddingTop = '';
        }
        return () => { if (appRoot) appRoot.style.paddingTop = ''; };
    }, [visible]);

    return (
        <div style={{
            position: 'fixed',
            top: 'env(safe-area-inset-top, 0px)', // Respect iOS notch / Dynamic Island
            left: 0,
            right: 0,
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 20px',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            backdropFilter: 'blur(8px)',
            background: isOnline ? 'rgba(34, 197, 94, 0.95)' : 'rgba(244, 194, 107, 0.95)',
            color: isOnline ? 'white' : '#111827',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, background 0.3s ease',
            transform: visible ? 'translateY(0)' : 'translateY(-120%)',
            opacity: visible ? 1 : 0,
            pointerEvents: visible ? 'auto' : 'none'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: '600px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                        {isOnline ? 'Back Online' : (localError || 'No Internet Connection')}
                    </span>
                </div>

                {!isOnline && (
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        style={{
                            background: 'rgba(0,0,0,0.06)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            color: '#111827',
                            fontWeight: 600,
                            fontSize: '13px',
                            opacity: isRefreshing ? 0.7 : 1
                        }}
                        onMouseDown={(e) => { if (!isRefreshing) e.currentTarget.style.transform = 'scale(0.95)'; }}
                        onMouseUp={(e) => { if (!isRefreshing) e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                        <RefreshCw
                            size={14}
                            className={isRefreshing ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                )}
            </div>
        </div>
    );
};

export default NetworkStatusBanner;
