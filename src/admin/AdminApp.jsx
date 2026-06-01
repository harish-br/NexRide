import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminDataProvider, useAdminData } from './context/AdminDataContext';
import Login from './components/Login';
import GlobalSearch from './components/GlobalSearch';
import './admin.css';

// We'll create these components next
import DashboardStats from './components/DashboardStats';
import PlacesManager from './components/PlacesManager';
import RoutesManager from './components/RoutesManager';
import BusesManager from './components/BusesManager';
import AuditLogs from './components/AuditLogs';
import AdminSettings from './components/AdminSettings';
import AdminRequests from './components/AdminRequests';
import ReportBus from './components/ReportBus';
import TeamMembersManager from './components/TeamMembersManager';

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminDataProvider>
        <AdminLayout />
      </AdminDataProvider>
    </AdminAuthProvider>
  );
}

function AdminLayout() {
  const { currentUser, isAdmin, logout } = useAdminAuth();
  const { busRequests } = useAdminData();
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentUser || !isAdmin) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardStats setCurrentView={setCurrentView} />;
      case 'report':
        return <ReportBus setCurrentView={setCurrentView} />;
      case 'places':
        return <PlacesManager />;
      case 'routes':
        return <RoutesManager />;
      case 'buses':
        return <BusesManager />;
      case 'requests':
        return <AdminRequests />;
      case 'logs':
        return <AuditLogs />;
      case 'team':
        return <TeamMembersManager />;
      case 'settings':
        return <AdminSettings setCurrentView={setCurrentView} />;
      default:
        return <DashboardStats setCurrentView={setCurrentView} />;
    }
  };

  const navigationContent = (
    <>
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#000000' }}>Menu</div>
          <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#000', lineHeight: 1 }}>×</button>
        </div>
      )}

      <nav className="admin-nav" style={{ 
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: isMobile ? '100%' : 'auto',
        gap: isMobile ? '8px' : '8px'
      }}>
        <div className={`admin-nav-item ${currentView === 'dashboard' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'dashboard' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('dashboard'); setMobileMenuOpen(false);}}>
          Dashboard
        </div>
        <div className={`admin-nav-item ${currentView === 'report' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'report' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('report'); setMobileMenuOpen(false);}}>
          Report Bus
        </div>
        <div className={`admin-nav-item ${currentView === 'places' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'places' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('places'); setMobileMenuOpen(false);}}>
          Places
        </div>
        <div className={`admin-nav-item ${currentView === 'routes' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'routes' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('routes'); setMobileMenuOpen(false);}}>
          Routes
        </div>
        <div className={`admin-nav-item ${currentView === 'buses' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'buses' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('buses'); setMobileMenuOpen(false);}}>
          Buses & Timings
        </div>
        <div className={`admin-nav-item ${currentView === 'requests' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'requests' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }} onClick={() => {setCurrentView('requests'); setMobileMenuOpen(false);}}>
          Approvals
          {busRequests && busRequests.length > 0 && (
            <span style={{ backgroundColor: 'var(--admin-danger)', color: '#FFF', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              {busRequests.length}
            </span>
          )}
        </div>
        <div className={`admin-nav-item ${currentView === 'logs' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'logs' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('logs'); setMobileMenuOpen(false);}}>
          Audit Logs
        </div>
        <div className={`admin-nav-item ${currentView === 'settings' ? 'active' : ''}`} style={{ color: isMobile ? '#000' : '#FFF', padding: isMobile ? '12px 16px' : '8px 16px', backgroundColor: (currentView === 'settings' && isMobile) ? 'var(--admin-bg-surface)' : undefined, borderRadius: isMobile ? '8px' : undefined }} onClick={() => {setCurrentView('settings'); setMobileMenuOpen(false);}}>
          Settings
        </div>
      </nav>

      <div className="admin-topbar-right" style={{ 
         display: 'flex', 
         flexDirection: isMobile ? 'column' : 'row',
         alignItems: isMobile ? 'stretch' : 'center',
         gap: isMobile ? '8px' : '16px',
         marginTop: 0,
         paddingTop: isMobile ? '8px' : '0'
      }}>
        {!isMobile && (
          <div style={{ width: '300px' }}>
            <GlobalSearch setGlobalView={(v) => { setCurrentView(v); setMobileMenuOpen(false); }} />
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="admin-root" style={{ overflowY: mobileMenuOpen ? 'hidden' : 'auto' }}>
      <header className="admin-topbar">
        <div className="admin-topbar-left" style={{ flex: isMobile ? 1 : 'none' }}>
          <div className="admin-logo" onClick={() => setCurrentView('dashboard')} style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px' }} />
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            style={{ display: isMobile ? 'block' : 'none', background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }} 
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>
        </div>

        {/* Navigation Container (Desktop inline, Mobile sidebar) */}
        {isMobile ? createPortal(
          <>
            {/* Overlay for mobile sidebar */}
            {mobileMenuOpen && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }} onClick={() => setMobileMenuOpen(false)}></div>
            )}
            <div 
              style={{
                position: 'fixed', top: 0, right: mobileMenuOpen ? 0 : '-100%', width: '80%', maxWidth: '320px', height: '100vh',
                backgroundColor: '#FFFFFF', zIndex: 1000, padding: '24px', display: 'flex', flexDirection: 'column',
                transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', overflowY: 'auto'
              }}
            >
              {navigationContent}
            </div>
          </>, document.body
        ) : (
          <div 
            style={{
              display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between', paddingLeft: '32px'
            }}
          >
            {navigationContent}
          </div>
        )}
      </header>

      <main className="admin-main">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {isMobile && currentView !== 'dashboard' && (
            <button 
              onClick={() => setCurrentView('dashboard')}
              style={{ background: 'transparent', border: 'none', padding: '8px 8px 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#000' }}
              aria-label="Back to Dashboard"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
          )}
          <h1 className="admin-title" style={{ textTransform: 'capitalize', margin: 0 }}>
            {currentView === 'logs' ? 'Audit Logs' : currentView}
          </h1>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

// End of AdminApp
