import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: '20px', color: '#333' }}>
                    <h1 style={{ color: '#E02424', fontSize: '24px' }}>Something went wrong.</h1>
                    <div style={{ background: '#FEE2E2', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid #FCA5A5' }}>
                        <p style={{ fontWeight: 600, margin: '0 0 10px' }}>{this.state.error && this.state.error.toString()}</p>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', background: 'rgba(255,255,255,0.5)', padding: '10px', overflowX: 'auto' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', background: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
