import React, { useState, useEffect } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function DashboardStats({ setCurrentView }) {
  const { schedules, auditLogs, loading } = useAdminData();

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--admin-text-secondary)' }} aria-live="polite">Loading real-time dashboard...</div>;
  }

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate live stats
  const placeNames = new Set();
  let totalBuses = 0;
  let activeServices = 0;
  let inactiveServices = 0;

  schedules.forEach(schedule => {
    if (schedule.source) placeNames.add(schedule.source.trim());
    if (schedule.destination) placeNames.add(schedule.destination.trim());

    const times = schedule.departure_times || [];
    const busDetails = schedule.bus_details || {};

    totalBuses += times.length;

    times.forEach(time => {
      const status = busDetails[time]?.status || schedule.status || 'active';
      if (status === 'active') activeServices++;
      else inactiveServices++;
    });
  });

  const totalPlaces = placeNames.size;
  const totalRoutes = schedules.length;

  return (
    <div>
      {isMobile && setCurrentView && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>Quick Access</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div 
              style={{ cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} 
              onClick={() => setCurrentView('places')}
            >
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Places</div>
              <svg style={{ marginLeft: '4px', color: 'var(--admin-accent)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div 
              style={{ cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} 
              onClick={() => setCurrentView('routes')}
            >
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Routes</div>
              <svg style={{ marginLeft: '4px', color: 'var(--admin-accent)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div 
              style={{ cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} 
              onClick={() => setCurrentView('buses')}
            >
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buses</div>
              <svg style={{ marginLeft: '4px', color: 'var(--admin-accent)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div 
              style={{ cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} 
              onClick={() => setCurrentView('logs')}
            >
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Logs</div>
              <svg style={{ marginLeft: '4px', color: 'var(--admin-accent)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <div 
              style={{ cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }} 
              onClick={() => setCurrentView('report')}
            >
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Bus</div>
              <svg style={{ marginLeft: '4px', color: 'var(--admin-accent)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.25rem', fontWeight: 700, color: '#000', display: isMobile ? 'block' : 'none' }}>Live Stats</h3>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Places</div>
          <div className="admin-stat-value">{totalPlaces}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Routes</div>
          <div className="admin-stat-value">{totalRoutes}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Buses</div>
          <div className="admin-stat-value">{totalBuses}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Active Services</div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-success)' }}>{activeServices}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Inactive Services</div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-danger)' }}>{inactiveServices}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '24px' }}>
        {/* Recent Updates Panel */}
        <div className="admin-glass" style={{ padding: isMobile ? '20px' : '32px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px', fontWeight: 700 }}>Recent Updates</h3>
          {auditLogs.length === 0 ? (
            <p style={{ color: 'var(--admin-text-secondary)' }}>No recent activity.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ width: '10px', height: '10px', backgroundColor: '#000000', marginTop: '6px' }}></div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{log.action.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', margin: '4px 0' }}>{log.details}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', opacity: 0.7 }}>
                      {log.timestamp ? new Date(log.timestamp.toMillis()).toLocaleString() : 'Just now'} • by {log.adminEmail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="admin-glass" style={{ padding: isMobile ? '20px' : '32px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px', fontWeight: 700 }}>System Status</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Database Sync: <span className="admin-badge admin-badge-success">Real-time Active</span>
          </p>
          <p style={{ margin: '0 0 24px 0', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Data Model: <span className="admin-badge admin-badge-success">100% Compatible</span>
          </p>
          <p style={{ margin: '0', color: 'var(--admin-text-secondary)' }}>
            The dashboard is natively synced with Firestore. Any changes made here are instantly reflected in the live NexRide application without needing a manual refresh.
          </p>
        </div>
      </div>
    </div>
  );
}
