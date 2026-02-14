import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, X, AlertTriangle } from 'lucide-react';
import { fetchTrainStatus } from '../utils/trainApi';
import TrainStatusDashboard from './TrainStatusDashboard';
import GlobalLoader from './GlobalLoader';

const TrainStatusSheet = ({ isOpen, onClose, trainNumber }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const loadStatus = useCallback(async () => {
        if (!trainNumber) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetchTrainStatus(trainNumber);
            if (res && res.data) {
                setData(res.data);
            } else {
                throw new Error("Unable to fetch status");
            }
        } catch (err) {
            setError(err.message || "Failed to load status");
        } finally {
            setLoading(false);
        }
    }, [trainNumber]);

    useEffect(() => {
        if (isOpen && trainNumber) {
            loadStatus();
        }
    }, [isOpen, trainNumber, loadStatus]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'white',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '50px 20px 20px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'white'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                        <X size={24} color="#111" />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111', margin: 0 }}>
                            Train Status
                        </h2>
                        {/* 
                            We hide the detailed name here because TrainStatusDashboard shows it. 
                            But we keep a generic title or simplified info.
                        */}
                    </div>
                </div>
                <button
                    onClick={loadStatus}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    disabled={loading}
                >
                    <RefreshCw
                        size={20}
                        color={loading ? '#3B82F6' : '#111'}
                        style={{
                            transform: loading ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.5s',
                            opacity: loading ? 0.5 : 1
                        }}
                    />
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', background: '#fff', padding: '16px' }}>
                {loading ? (
                    <GlobalLoader message="Loading live status..." />
                ) : error ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#EF4444' }}>
                        <AlertTriangle size={40} style={{ marginBottom: '16px', opacity: 0.8 }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px 0' }}>Oops! Failed to load status</h3>
                        <p style={{ fontSize: '14px', color: '#6B7280', margin: '0 0 24px 0' }}>{error}</p>
                        <button
                            onClick={loadStatus}
                            style={{
                                padding: '12px 24px', borderRadius: '12px', background: '#3B82F6',
                                color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : data ? (
                    <TrainStatusDashboard data={data} />
                ) : null}
            </div>
        </div>
    );
};

export default TrainStatusSheet;
