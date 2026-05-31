import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminSettings() {
  const { currentUser, logout } = useAdminAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  return (
    <div className="admin-animate-fade">
      <div style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>Profile Information</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px' }}>
            <div className="admin-input-group">
              <label className="admin-label">Email Address</label>
              <input 
                type="text" 
                className="admin-input" 
                value={currentUser?.email || ''} 
                disabled 
                style={{ backgroundColor: '#F0F0F0', color: '#666666', cursor: 'not-allowed' }}
              />
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Administrator UID</label>
              <input 
                type="text" 
                className="admin-input" 
                value={currentUser?.uid || ''} 
                disabled 
                style={{ backgroundColor: '#F0F0F0', color: '#666666', cursor: 'not-allowed', fontFamily: 'monospace' }}
              />
              <small style={{ color: 'var(--admin-text-secondary)', marginTop: '4px' }}>This ID represents your authorized access in the Firestore 'admins' collection.</small>
            </div>

            <div className="admin-input-group">
              <label className="admin-label">Access Level</label>
              <div style={{ padding: '14px 16px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)', border: '1px solid var(--admin-border)', fontWeight: 600 }}>
                Super Administrator
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>System Preferences</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '24px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Audit Log Notifications</div>
                <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>Receive email alerts for critical administrative actions (e.g. route deletion).</div>
              </div>
              <button 
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                style={{ 
                  width: '48px', height: '24px', borderRadius: '12px', flexShrink: 0,
                  backgroundColor: notificationsEnabled ? 'var(--admin-accent)' : '#CCCCCC', 
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF', 
                  position: 'absolute', top: '2px', left: notificationsEnabled ? '26px' : '2px', 
                  transition: 'left 0.2s'
                }}></div>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '24px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>Real-time Data Synchronization</div>
                <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>Automatically pull latest changes from Firestore without refreshing the dashboard.</div>
              </div>
              <button 
                onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                style={{ 
                  width: '48px', height: '24px', borderRadius: '12px', flexShrink: 0,
                  backgroundColor: autoSyncEnabled ? 'var(--admin-accent)' : '#CCCCCC', 
                  position: 'relative', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s'
                }}
              >
                <div style={{ 
                  width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FFFFFF', 
                  position: 'absolute', top: '2px', left: autoSyncEnabled ? '26px' : '2px', 
                  transition: 'left 0.2s'
                }}></div>
              </button>
            </div>

          </div>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px', color: 'var(--admin-danger)' }}>Account Actions</h2>
          
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={logout}
              className="admin-btn admin-btn-danger" 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
