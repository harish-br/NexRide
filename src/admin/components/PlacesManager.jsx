import React, { useState, useEffect } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function PlacesManager() {
  const { schedules } = useAdminData();
  const [search, setSearch] = useState('');
  
  // Navigation states
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ oldName: '', newName: '' });

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Calculate unique places
  const placeNames = new Set();
  schedules.forEach(s => {
    if (s.source) placeNames.add(s.source.trim());
    if (s.destination) placeNames.add(s.destination.trim());
  });
  
  const allPlaces = Array.from(placeNames).sort((a, b) => a.localeCompare(b));
  const filteredPlaces = allPlaces.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  // 2. Rename Handlers
  const handleOpenModal = (e, placeName) => {
    e.stopPropagation();
    setFormData({ oldName: placeName, newName: placeName });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.newName.trim() !== formData.oldName) {
        if (window.confirm(`This will update ALL routes that use "${formData.oldName}" to "${formData.newName.trim()}". Are you sure?`)) {
          await adminService.updatePlace(formData.oldName, formData.newName.trim());
          if (selectedPlace === formData.oldName) {
            setSelectedPlace(formData.newName.trim());
          }
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to rename place:", error);
      alert("Failed to rename place.");
    }
  };

  // --- RENDER MASTER VIEW (Place List) ---
  if (!selectedPlace) {
    return (
      <div>
        <div className="admin-header" style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            className="admin-input" 
            placeholder="Search places..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '300px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredPlaces.map(place => {
            // Calculate quick stats for the card
            let routeCount = 0;
            let busCount = 0;
            schedules.forEach(s => {
              if (s.source === place || s.destination === place) {
                routeCount++;
                busCount += (s.departure_times || []).length;
              }
            });

            return (
              <div 
                key={place} 
                className="admin-stat-card" 
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedPlace(place)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, textTransform: 'capitalize', fontSize: '1.25rem' }}>{place}</h3>
                  <button className="admin-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={(e) => handleOpenModal(e, place)}>
                    Rename
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Routes</div>
                    <div style={{ fontWeight: 600 }}>{routeCount}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)' }}>Buses</div>
                    <div style={{ fontWeight: 600 }}>{busCount}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rename Modal */}
        {showModal && (
          <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="admin-modal admin-animate-fade" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3 className="admin-modal-title">Rename Place</h3>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  <div className="admin-input-group">
                    <label className="admin-label">Place Name</label>
                    <input 
                      type="text" 
                      className="admin-input" 
                      value={formData.newName}
                      onChange={e => setFormData({...formData, newName: e.target.value})}
                      required
                    />
                    <small style={{ color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                      Updates {formData.oldName} globally.
                    </small>
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="admin-btn admin-btn-primary">Rename Everywhere</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDER DETAIL VIEW (Place Dashboard) ---
  const placeRoutes = schedules.filter(s => s.source === selectedPlace || s.destination === selectedPlace);
  
  let totalPlaceBuses = 0;
  let departuresToday = 0;
  let arrivalsToday = 0;
  
  placeRoutes.forEach(s => {
    const times = s.departure_times || [];
    totalPlaceBuses += times.length;
    if (s.source === selectedPlace) departuresToday += times.length;
    if (s.destination === selectedPlace) arrivalsToday += times.length;
  });

  return (
    <div className="admin-animate-fade">
      <button className="admin-btn" style={{ marginBottom: '24px' }} onClick={() => { setSelectedPlace(null); setSelectedRoute(null); }}>
        ← Back to Places
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: '0 0 8px 0', textTransform: 'capitalize', fontSize: '2rem' }}>{selectedPlace}</h2>
          <div style={{ color: 'var(--admin-text-secondary)' }}>Place Management Dashboard</div>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '40px' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Routes</div>
          <div className="admin-stat-value">{placeRoutes.length}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Total Buses</div>
          <div className="admin-stat-value">{totalPlaceBuses}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Departures (Source)</div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-accent)' }}>{departuresToday}</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-label">Arrivals (Dest)</div>
          <div className="admin-stat-value" style={{ color: 'var(--admin-success)' }}>{arrivalsToday}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '24px' }}>
        {/* ROUTES PANEL */}
        <div className="admin-glass" style={{ padding: isMobile ? '20px' : '32px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.5rem', fontWeight: 700, borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>Available Routes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
            {placeRoutes.length === 0 ? (
              <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No routes found</div>
                <div style={{ fontSize: '0.9rem' }}>This place is not connected to any active routes.</div>
              </div>
            ) : (
              placeRoutes.map(route => (
                <div 
                  key={route.id} 
                  className={`admin-nav-item ${selectedRoute?.id === route.id ? 'active' : ''}`}
                  style={{ 
                    border: '2px solid', 
                    padding: '16px', 
                    display: 'block',
                    backgroundColor: '#FFFFFF',
                    borderColor: selectedRoute?.id === route.id ? 'var(--admin-accent)' : 'transparent',
                    borderRadius: 'var(--admin-radius)'
                  }}
                  onClick={() => {
                    setSelectedRoute(route);
                    if (isMobile) {
                      setTimeout(() => {
                        document.getElementById('buses-panel')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: selectedRoute?.id === route.id ? 'var(--admin-accent)' : '#000000' }}>
                    {route.source} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, margin: '0 4px' }}>➔</span> {route.destination}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '0.85rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>{(route.departure_times || []).length} Buses</div>
                    {route.routeNumber && <div><span style={{ color: 'var(--admin-text-secondary)', marginRight: '4px' }}>Route</span> {route.routeNumber}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BUSES PANEL */}
        <div className="admin-glass" id="buses-panel" style={{ padding: isMobile ? '20px' : '32px', backgroundColor: 'var(--admin-bg-surface)', borderRadius: 'var(--admin-radius)' }}>
          {!selectedRoute ? (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
              Select a route to view buses
            </div>
          ) : (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700 }}>
                {selectedRoute.source} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, margin: '0 4px' }}>➔</span> {selectedRoute.destination}
              </h3>
              <div style={{ color: 'var(--admin-text-secondary)', marginBottom: '24px', fontSize: '0.9rem', paddingBottom: '16px', borderBottom: '1px solid var(--admin-border)' }}>
                Via: <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{selectedRoute.via || 'Direct'}</span> • Distance: <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{selectedRoute.distance || 'N/A'}km</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '8px' }}>
                {(selectedRoute.departure_times || []).length === 0 ? (
                  <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No buses scheduled</div>
                    <div style={{ fontSize: '0.9rem' }}>There are currently no buses operating on this specific route.</div>
                  </div>
                ) : (
                  (selectedRoute.departure_times || []).map(time => {
                    const busDetails = (selectedRoute.bus_details || {})[time] || {};
                    return (
                      <div key={time} style={{ padding: '20px', border: 'none', borderRadius: 'var(--admin-radius)', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#000000' }}>{time}</span>
                          <span className={`admin-badge ${busDetails.status === 'inactive' ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                            {busDetails.status || 'Active'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem', color: 'var(--admin-text-secondary)' }}>
                          <div><strong style={{ color: '#000000' }}>Bus No:</strong> {busDetails.busNumber || 'N/A'}</div>
                          <div><strong style={{ color: '#000000' }}>Arrival:</strong> {busDetails.arrivalTime || 'N/A'}</div>
                          <div><strong style={{ color: '#000000' }}>Type:</strong> {busDetails.busType || selectedRoute.serviceType || 'Standard'}</div>
                          <div><strong style={{ color: '#000000' }}>Days:</strong> {(busDetails.operatingDays || ['All']).join(', ')}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
