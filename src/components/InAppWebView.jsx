import React, { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import GlobalLoader from './GlobalLoader';

const InAppWebView = ({ title, url, onBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Allow retrying
    const handleReload = () => {
        setIsLoading(true);
        setHasError(false);
        // Force iframe reload by updating key or just resetting state (iframe re-mounts)
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: '#fff',
            zIndex: 5000,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: 'white',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none', border: 'none', padding: '8px',
                            marginRight: '8px', cursor: 'pointer', display: 'flex',
                            borderRadius: '50%',
                            backgroundColor: '#F3F4F6'
                        }}
                    >
                        <ArrowLeft size={20} color="#111827" />
                    </button>
                    <h1 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                        {title}
                    </h1>
                </div>
                {/* Reload button */}
                <button
                    onClick={handleReload}
                    style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}
                >
                    <RefreshCw size={18} color="#6B7280" />
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, position: 'relative', backgroundColor: '#F9FAFB' }}>

                {/* Loading Indicator */}
                {isLoading && <GlobalLoader message="Loading content..." />}

                {/* Error State */}
                {hasError && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: '#fff', zIndex: 20
                    }}>
                        <div style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ color: '#EF4444', fontWeight: '600', marginBottom: '8px' }}>Unable to load page</p>
                            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '16px' }}>Please check your internet connection.</p>
                            <button
                                onClick={handleReload}
                                style={{
                                    padding: '8px 16px', backgroundColor: '#111827', color: 'white',
                                    borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '500'
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* The Iframe */}
                {!hasError && (
                    <iframe
                        key={isLoading ? 'loading' : 'loaded'} // Force remount on explicit reload
                        src={url}
                        title={title}
                        width="100%"
                        height="100%"
                        style={{ border: 'none', display: 'block' }}
                        onLoad={() => setIsLoading(false)}
                        onError={() => { setIsLoading(false); setHasError(true); }}
                    />
                )}
            </div>
        </div>
    );
};

export default InAppWebView;
