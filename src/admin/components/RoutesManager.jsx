import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function RoutesManager() {
  const { schedules } = useAdminData();
  
  // Search and Filter
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Sort
  const [sortConfig, setSortConfig] = useState({ key: 'source', direction: 'asc' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ 
    routeNumber: '', source: '', destination: '', distance: '', status: 'active', via: '', serviceType: '', operatorName: ''
  });

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [selectedMobileRoute, setSelectedMobileRoute] = useState(null);
  const [mobileSheetView, setMobileSheetView] = useState('details');

  const handleOpenModal = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({ 
        routeNumber: route.routeNumber || '', source: route.source || '', destination: route.destination || '', 
        distance: route.distance || '', status: route.status || 'active', via: route.via || '', 
        serviceType: route.serviceType || '', operatorName: route.operatorName || ''
      });
    } else {
      setEditingRoute(null);
      setFormData({ 
        routeNumber: '', source: '', destination: '', distance: '', status: 'active', via: '', serviceType: '', operatorName: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await adminService.updateRoute(editingRoute.id, formData);
      } else {
        await adminService.addRoute(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save route:", error);
      alert("Failed to save route.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this route? This will delete all buses on this route.")) {
      setDeletingId(id);
      try {
        await adminService.deleteRoute(id);
      } catch (error) {
        console.error("Failed to delete route:", error);
        alert("Failed to delete route.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Processing Data
  const processedRoutes = useMemo(() => {
    let filtered = schedules.filter(r => {
      const q = search.toLowerCase();
      const matchesSearch = 
        (r.routeNumber || '').toLowerCase().includes(q) ||
        (r.source || '').toLowerCase().includes(q) ||
        (r.destination || '').toLowerCase().includes(q);
      const matchesStatus = filterStatus === 'All' || (r.status || 'active') === filterStatus;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [schedules, search, filterStatus, sortConfig]);

  // Pagination bounds
  const totalPages = Math.ceil(processedRoutes.length / itemsPerPage);
  const currentData = processedRoutes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const exportCSV = () => {
    const headers = ["Route Number", "Source", "Destination", "Via", "Distance (km)", "Scheduled Trips", "Status"];
    const rows = processedRoutes.map(r => [
      r.routeNumber || '',
      r.source || '',
      r.destination || '',
      `"${r.via || ''}"`,
      r.distance || '',
      (r.departure_times || []).length,
      r.status || 'active'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `routes_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            className="admin-input" 
            placeholder="Search routes..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ flex: '1 1 200px', minWidth: '150px' }}
            aria-label="Search routes"
          />
          <select 
            className="admin-input"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ flex: '1 1 120px', minWidth: '120px' }}
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', flex: '1 1 250px', flexWrap: 'wrap' }}>
          <button className="admin-btn" style={{ flex: '1 1 auto', minWidth: '120px' }} onClick={exportCSV}>
            Export CSV
          </button>
          <button className="admin-btn admin-btn-primary" style={{ flex: '1 1 auto', minWidth: '150px' }} onClick={() => handleOpenModal()} aria-label="Add New Route">
            + Add New Route
          </button>
        </div>
      </div>

      {isMobile ? (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentData.length === 0 ? (
              <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No routes found</div>
                <div style={{ fontSize: '0.9rem' }}>Try adjusting your search criteria or create a new route.</div>
              </div>
            ) : (
              currentData.map(route => (
                <div 
                  key={route.id} 
                  className="admin-stat-card" 
                  style={{ padding: '20px', cursor: 'pointer', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}
                  onClick={() => { setSelectedMobileRoute(route); setMobileSheetView('details'); }}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
                      {route.source} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, margin: '0 4px' }}>➔</span> {route.destination}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`admin-badge ${(route.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                        {route.status || 'active'}
                      </span>
                      • Tap to view options
                    </div>
                  </div>
                  <div style={{ color: 'var(--admin-accent)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid var(--admin-border)', marginTop: '24px' }}>
              <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedRoutes.length)} of {processedRoutes.length}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="admin-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '6px 12px' }}>Prev</button>
                <button className="admin-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '6px 12px' }}>Next</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table" aria-label="Routes list">
            <thead>
              <tr>
                <th onClick={() => requestSort('routeNumber')} style={{ cursor: 'pointer' }}>Route # {sortConfig.key === 'routeNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('source')} style={{ cursor: 'pointer' }}>Source {sortConfig.key === 'source' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('destination')} style={{ cursor: 'pointer' }}>Destination {sortConfig.key === 'destination' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th>Buses</th>
                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No routes found</div>
                      <div style={{ fontSize: '0.9rem' }}>Try adjusting your search criteria or create a new route.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map(route => (
                  <tr key={route.id}>
                    <td style={{ fontWeight: 500 }}>{route.routeNumber || '-'}</td>
                    <td>{route.source}</td>
                    <td>{route.destination}</td>
                    <td>{(route.departure_times || []).length}</td>
                    <td>
                      <span className={`admin-badge ${(route.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {route.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="admin-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px' }} onClick={() => handleOpenModal(route)} aria-label={`Edit route from ${route.source} to ${route.destination}`}>
                        Edit
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(route.id)} disabled={deletingId === route.id} aria-label={`Delete route from ${route.source} to ${route.destination}`}>
                        {deletingId === route.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--admin-border)' }}>
              <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem' }}>
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedRoutes.length)} of {processedRoutes.length} entries
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="admin-btn" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: '6px 12px' }}
                >
                  Prev
                </button>
                <button 
                  className="admin-btn" 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: '6px 12px' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && createPortal(
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal admin-animate-fade" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="route-modal-title">
            <div className="admin-modal-header">
              <h3 id="route-modal-title" className="admin-modal-title">{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                  <div className="admin-input-group">
                    <label htmlFor="route-number" className="admin-label">Route Number</label>
                    <input id="route-number" type="text" className="admin-input" value={formData.routeNumber} onChange={e => setFormData({...formData, routeNumber: e.target.value})} />
                  </div>
                  <div className="admin-input-group">
                    <label htmlFor="status" className="admin-label">Status</label>
                    <select id="status" className="admin-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="admin-input-group">
                    <label htmlFor="source-city" className="admin-label">Source City</label>
                    <input id="source-city" type="text" className="admin-input" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} required />
                  </div>
                  <div className="admin-input-group">
                    <label htmlFor="destination-city" className="admin-label">Destination City</label>
                    <input id="destination-city" type="text" className="admin-input" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                  </div>
                  <div className="admin-input-group">
                    <label htmlFor="distance" className="admin-label">Distance (km)</label>
                    <input id="distance" type="number" className="admin-input" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} />
                  </div>
                  <div className="admin-input-group" style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                    <label htmlFor="via" className="admin-label">Via Stops (Comma separated)</label>
                    <input id="via" type="text" className="admin-input" value={formData.via} onChange={e => setFormData({...formData, via: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Save Route</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Bottom Sheet for Route Details / Editing */}
      {selectedMobileRoute && createPortal(
        <div className="admin-bottom-sheet-overlay" onClick={() => setSelectedMobileRoute(null)}>
          <div className="admin-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', backgroundColor: '#fff', borderBottom: '1px solid var(--admin-border)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
                {mobileSheetView === 'edit' ? 'Edit Route' : 'Route Options'}
              </h3>
              <button onClick={() => {
                if (mobileSheetView === 'edit') setMobileSheetView('details');
                else setSelectedMobileRoute(null);
              }} style={{ background: 'none', border: 'none', fontSize: mobileSheetView === 'edit' ? '1rem' : '2rem', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, fontWeight: 600 }}>
                {mobileSheetView === 'edit' ? 'Cancel' : '×'}
              </button>
            </div>
            
            <div style={{ padding: '24px', flex: 1 }}>
              {mobileSheetView === 'details' ? (
                <>
                  <div style={{ backgroundColor: 'var(--admin-bg-surface)', padding: '20px', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000', marginBottom: '24px' }}>
                      {selectedMobileRoute.source} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, margin: '0 4px' }}>➔</span> {selectedMobileRoute.destination}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Route Number</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileRoute.routeNumber || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Scheduled Trips</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{(selectedMobileRoute.departure_times || []).length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Distance</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileRoute.distance || '-'} km</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Status</div>
                        <div style={{ display: 'inline-block' }} className={`admin-badge ${(selectedMobileRoute.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {selectedMobileRoute.status || 'active'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button 
                      className="admin-btn admin-btn-primary" 
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} 
                      onClick={() => {
                        setEditingRoute(selectedMobileRoute);
                        setFormData({ 
                          routeNumber: selectedMobileRoute.routeNumber || '', source: selectedMobileRoute.source || '', destination: selectedMobileRoute.destination || '', 
                          distance: selectedMobileRoute.distance || '', status: selectedMobileRoute.status || 'active', via: selectedMobileRoute.via || '', 
                          serviceType: selectedMobileRoute.serviceType || '', operatorName: selectedMobileRoute.operatorName || ''
                        });
                        setMobileSheetView('edit');
                      }}
                    >
                      Edit Route
                    </button>
                    <button 
                      className="admin-btn admin-btn-danger" 
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} 
                      onClick={() => {
                        handleDelete(selectedMobileRoute.id).then(() => {
                          setSelectedMobileRoute(null);
                        });
                      }}
                      disabled={deletingId === selectedMobileRoute.id}
                    >
                      {deletingId === selectedMobileRoute.id ? 'Deleting...' : 'Delete Route'}
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={(e) => {
                  handleSubmit(e).then(() => {
                    setSelectedMobileRoute({...selectedMobileRoute, ...formData});
                    setMobileSheetView('details');
                  }).catch(err => console.error(err));
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="admin-input-group">
                      <label htmlFor="route-number-mob" className="admin-label">Route Number</label>
                      <input id="route-number-mob" type="text" className="admin-input" value={formData.routeNumber} onChange={e => setFormData({...formData, routeNumber: e.target.value})} />
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="status-mob" className="admin-label">Status</label>
                      <select id="status-mob" className="admin-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="source-city-mob" className="admin-label">Source City</label>
                      <input id="source-city-mob" type="text" className="admin-input" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} required />
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="destination-city-mob" className="admin-label">Destination City</label>
                      <input id="destination-city-mob" type="text" className="admin-input" value={formData.destination} onChange={e => setFormData({...formData, destination: e.target.value})} required />
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="distance-mob" className="admin-label">Distance (km)</label>
                      <input id="distance-mob" type="number" className="admin-input" value={formData.distance} onChange={e => setFormData({...formData, distance: e.target.value})} />
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="via-mob" className="admin-label">Via Stops (Comma separated)</label>
                      <input id="via-mob" type="text" className="admin-input" value={formData.via} onChange={e => setFormData({...formData, via: e.target.value})} />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', marginTop: '16px' }}>Save Changes</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
