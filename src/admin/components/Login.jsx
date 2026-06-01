import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminService } from '../services/adminService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { login, logout, authError, unauthorizedUser } = useAdminAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      setLoading(true);
      await login(email, password);
    } catch (err) {
      console.error(err);
      setLocalError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!unauthorizedUser) return;
    try {
      setLoading(true);
      await adminService.requestAdminAccess(unauthorizedUser.uid, unauthorizedUser.email);
      setRequestSent(true);
    } catch (err) {
      console.error(err);
      setLocalError('Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="admin-root" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="admin-glass" style={{ padding: '40px', borderRadius: '16px', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="admin-title" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>NexRide Admin</h1>
          <p style={{ color: 'var(--admin-text-secondary)', margin: 0 }}>Sign in to access the dashboard</p>
        </div>

        {displayError && (
          <div className="admin-badge-danger" style={{ padding: '12px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.4' }}>
            {displayError}
          </div>
        )}

        {unauthorizedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requestSent ? (
              <div className="admin-badge-success" style={{ padding: '16px', borderRadius: '8px', textAlign: 'center', lineHeight: '1.4', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                Your request has been sent! An existing admin must approve it before you can access the dashboard.
              </div>
            ) : (
              <button 
                onClick={handleRequestAccess}
                className="admin-btn admin-btn-primary" 
                style={{ width: '100%', padding: '12px' }}
                disabled={loading}
              >
                {loading ? 'Sending Request...' : 'Request Admin Access'}
              </button>
            )}
            <button 
              onClick={() => { setRequestSent(false); logout(); }}
              className="admin-btn" 
              style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
              disabled={loading}
            >
              Sign Out & Try Another Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="admin-input-group">
              <label className="admin-label">Email Address</label>
              <input 
                type="email" 
                className="admin-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div className="admin-input-group" style={{ marginBottom: '24px' }}>
              <label className="admin-label">Password</label>
              <input 
                type="password" 
                className="admin-input" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button 
              type="submit" 
              className="admin-btn admin-btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
