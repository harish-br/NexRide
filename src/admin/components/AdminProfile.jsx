import React from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProfile() {
  const { currentUser, logout } = useAdminAuth();

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
      <div className="admin-stat-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div 
          style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--admin-accent)', 
            color: '#FFF', 
            fontSize: '2rem', 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px' 
          }}
        >
          {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
        </div>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 700 }}>{currentUser?.email || 'admin@nexride.com'}</h2>
        <div style={{ color: 'var(--admin-text-secondary)', fontWeight: 600, marginBottom: '32px' }}>Administrator</div>
        
        <div style={{ backgroundColor: 'var(--admin-bg)', borderRadius: '8px', padding: '16px', textAlign: 'left', marginBottom: '32px', border: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Account Status</span>
            <span style={{ color: 'var(--admin-success)', fontWeight: 700 }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 600 }}>Access Level</span>
            <span style={{ fontWeight: 700 }}>Full Admin</span>
          </div>
        </div>

        <button 
          onClick={logout}
          className="admin-btn admin-btn-danger" 
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
