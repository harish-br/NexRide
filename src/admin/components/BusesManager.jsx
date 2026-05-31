import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function BusesManager() {
  const { schedules } = useAdminData();

  // Search and Filter
  const [search, setSearch] = useState('');
  const [filterRoute, setFilterRoute] = useState('All');

  // Sort
  const [sortConfig, setSortConfig] = useState({ key: 'departureTime', direction: 'asc' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState({
    busNumber: '', routeId: '', departureTime: '', arrivalTime: '', busType: '', status: 'active', conductorName: '', driverName: '',
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  });

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedMobileBus, setSelectedMobileBus] = useState(null);
  const [mobileSheetView, setMobileSheetView] = useState('details');

  // Flatten buses from context
  const buses = useMemo(() => {
    const flat = [];
    schedules.forEach(schedule => {
      const times = schedule.departure_times || [];
      const busDetailsMap = schedule.bus_details || {};

      times.forEach(time => {
        const details = busDetailsMap[time] || {};
        flat.push({
          id: `${schedule.id}_${time}`,
          routeId: schedule.id,
          source: schedule.source,
          destination: schedule.destination,
          routeNumber: schedule.routeNumber || '',
          departureTime: time,
          busNumber: details.busNumber || '',
          busType: details.busType || schedule.serviceType || 'Standard',
          operatorName: details.operatorName || schedule.operatorName || 'TNSTC',
          via: details.via || schedule.via || (schedule.route_stops ? schedule.route_stops.join(', ') : ''),
          arrivalTime: details.arrivalTime || '',
          operatingDays: details.operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          status: details.status || schedule.status || 'active'
        });
      });
    });
    return flat;
  }, [schedules]);

  const getRouteString = (routeId) => {
    const route = schedules.find(s => s.id === routeId);
    return route ? `${route.source} ➔ ${route.destination}` : 'Unknown Route';
  };

  const handleOpenModal = (bus = null) => {
    if (bus) {
      setEditingBus(bus);
      setFormData({
        routeId: bus.routeId,
        departureTime: bus.departureTime,
        busNumber: bus.busNumber || '',
        arrivalTime: bus.arrivalTime || '',
        busType: bus.busType || '',
        operatorName: bus.operatorName || '',
        via: bus.via || '',
        status: bus.status || 'active',
        operatingDays: bus.operatingDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      });
    } else {
      setEditingBus(null);
      setFormData({
        routeId: schedules.length > 0 ? schedules[0].id : '',
        departureTime: '', busNumber: '', arrivalTime: '',
        busType: '', operatorName: '', via: '', status: 'active',
        operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      });
    }
    setShowModal(true);
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingDays: prev.operatingDays.includes(day)
        ? prev.operatingDays.filter(d => d !== day)
        : [...prev.operatingDays, day]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBus) {
        if (editingBus.routeId !== formData.routeId) {
          await adminService.deleteBus(editingBus.routeId, editingBus.departureTime);
          await adminService.addBus(formData);
        } else {
          await adminService.updateBus(editingBus.id, formData, editingBus.departureTime);
        }
      } else {
        await adminService.addBus(formData);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save timing:", error);
      alert("Failed to save timing.");
    }
  };

  const handleDelete = async (bus) => {
    if (window.confirm("Are you sure you want to delete this timing?")) {
      try {
        await adminService.deleteBus(bus.routeId, bus.departureTime);
      } catch (error) {
        console.error("Failed to delete timing:", error);
        alert("Failed to delete timing.");
      }
    }
  };

  const processedBuses = useMemo(() => {
    let filtered = buses.filter(b => {
      const q = search.toLowerCase();
      const matchesSearch =
        (b.busNumber || '').toLowerCase().includes(q) ||
        (b.source || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q) ||
        (b.departureTime || '').includes(q) ||
        (b.busType || '').toLowerCase().includes(q);
      const matchesRoute = filterRoute === 'All' || b.routeId === filterRoute;
      return matchesSearch && matchesRoute;
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
  }, [buses, search, filterRoute, sortConfig]);

  const totalPages = Math.ceil(processedBuses.length / itemsPerPage);
  const currentData = processedBuses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const exportCSV = () => {
    const headers = ["Route", "Bus Number", "Departure Time", "Arrival Time", "Bus Type", "Operator", "Via", "Operating Days", "Status"];
    const rows = processedBuses.map(b => [
      `"${b.source} - ${b.destination}"`,
      b.busNumber || '',
      b.departureTime || '',
      b.arrivalTime || '',
      `"${b.busType || ''}"`,
      `"${b.operatorName || ''}"`,
      `"${b.via || ''}"`,
      `"${(b.operatingDays || []).join(', ')}"`,
      b.status || 'active'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="admin-animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flex: '1 1 300px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Search buses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ flex: '1 1 200px', minWidth: '150px' }}
            aria-label="Search buses"
          />
          <select
            className="admin-input"
            value={filterRoute}
            onChange={(e) => { setFilterRoute(e.target.value); setCurrentPage(1); }}
            style={{ flex: '1 1 200px', minWidth: '150px' }}
            aria-label="Filter by route"
          >
            <option value="All">All Routes</option>
            {schedules.map(r => (
              <option key={r.id} value={r.id}>{r.source} ➔ {r.destination} {r.routeNumber ? `(${r.routeNumber})` : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', flex: '1 1 250px', flexWrap: 'wrap' }}>
          <button className="admin-btn" style={{ flex: '1 1 auto', minWidth: '120px' }} onClick={exportCSV}>
            Export CSV
          </button>
          <button className="admin-btn admin-btn-primary" style={{ flex: '1 1 auto', minWidth: '150px' }} onClick={() => handleOpenModal()} aria-label="Add New Bus">
            + Add New Bus
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
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No buses found</div>
                <div style={{ fontSize: '0.9rem' }}>Try adjusting your search criteria or create a new bus.</div>
              </div>
            ) : (
              currentData.map(bus => (
                <div
                  key={bus.id}
                  className="admin-stat-card"
                  style={{ padding: '20px', cursor: 'pointer', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}
                  onClick={() => { setSelectedMobileBus(bus); setMobileSheetView('details'); }}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
                      {bus.busNumber} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, fontSize: '0.9rem', margin: '0 4px' }}>•</span> <span style={{ fontSize: '1rem', fontWeight: 600 }}>{bus.departureTime}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginTop: '4px' }}>
                      Route: {getRouteString(bus.routeId)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`admin-badge ${(bus.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                        {bus.status || 'active'}
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedBuses.length)} of {processedBuses.length}
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
          <table className="admin-table" aria-label="Buses list">
            <thead>
              <tr>
                <th onClick={() => requestSort('busNumber')} style={{ cursor: 'pointer' }}>Bus Name/Number {sortConfig.key === 'busNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('routeId')} style={{ cursor: 'pointer' }}>Route {sortConfig.key === 'routeId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('departureTime')} style={{ cursor: 'pointer' }}>Departure {sortConfig.key === 'departureTime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th onClick={() => requestSort('arrivalTime')} style={{ cursor: 'pointer' }}>Arrival {sortConfig.key === 'arrivalTime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>

                <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No buses found</div>
                      <div style={{ fontSize: '0.9rem' }}>Try adjusting your search criteria or create a new bus.</div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentData.map(bus => (
                  <tr key={bus.id}>
                    <td style={{ fontWeight: 500 }}>{bus.busNumber}</td>
                    <td>{getRouteString(bus.routeId)}</td>
                    <td>{bus.departureTime}</td>
                    <td>{bus.arrivalTime}</td>

                    <td>
                      <span className={`admin-badge ${(bus.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                        {bus.status || 'active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="admin-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px' }} onClick={() => handleOpenModal(bus)} aria-label={`Edit bus ${bus.busNumber}`}>
                        Edit
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleDelete(bus)} aria-label={`Delete bus ${bus.busNumber}`}>
                        Delete
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedBuses.length)} of {processedBuses.length} entries
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
          <div className="admin-modal admin-animate-fade" onClick={e => e.stopPropagation()} role="dialog">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingBus ? 'Edit Bus' : 'Add New Bus'}</h3>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="admin-input-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="routeId" className="admin-label">Route</label>
                    <select id="routeId" className="admin-input" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })} required>
                      <option value="" disabled>Select a route</option>
                      {schedules.map(r => (
                        <option key={r.id} value={r.id}>{r.source} ➔ {r.destination}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-input-group">
                    <label htmlFor="departureTime" className="admin-label">Departure Time (24H)</label>
                    <input id="departureTime" type="time" className="admin-input" value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} required />
                  </div>

                  <div className="admin-input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <label htmlFor="arrivalTime" className="admin-label" style={{ marginBottom: 0 }}>Arrival Time (24H - Optional)</label>
                      {formData.arrivalTime && (
                        <button type="button" onClick={() => setFormData({ ...formData, arrivalTime: '' })} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Clear</button>
                      )}
                    </div>
                    <input id="arrivalTime" type="time" className="admin-input" value={formData.arrivalTime} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} style={{ marginTop: '8px' }} />
                  </div>

                  <div className="admin-input-group">
                    <label htmlFor="busNumber" className="admin-label">Bus Name/Number</label>
                    <input id="busNumber" type="text" className="admin-input" value={formData.busNumber} onChange={e => setFormData({ ...formData, busNumber: e.target.value })} placeholder="e.g. TN 12 AB 3456" />
                  </div>

                  <div className="admin-input-group">
                    <label htmlFor="status" className="admin-label">Status</label>
                    <select id="status" className="admin-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>



                  <div className="admin-input-group">
                    <label htmlFor="operatorName" className="admin-label">Operator Name</label>
                    <input id="operatorName" type="text" className="admin-input" value={formData.operatorName} onChange={e => setFormData({ ...formData, operatorName: e.target.value })} required />
                  </div>

                  <div className="admin-input-group" style={{ gridColumn: '1 / -1' }}>
                    <label htmlFor="via" className="admin-label">Via (Intermediate stops, comma separated)</label>
                    <input id="via" type="text" className="admin-input" value={formData.via} onChange={e => setFormData({ ...formData, via: e.target.value })} />
                  </div>

                  <div className="admin-input-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label" style={{ marginBottom: '8px' }}>Operating Days</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {allDays.map(day => (
                        <div
                          key={day}
                          onClick={() => handleDayToggle(day)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            backgroundColor: formData.operatingDays.includes(day) ? 'var(--admin-accent)' : 'transparent',
                            color: formData.operatingDays.includes(day) ? 'white' : 'var(--admin-text-secondary)',
                            border: `1px solid ${formData.operatingDays.includes(day) ? 'var(--admin-accent)' : 'var(--admin-border)'}`
                          }}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Save Bus</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Bottom Sheet for Bus Details / Editing */}
      {selectedMobileBus && createPortal(
        <div className="admin-bottom-sheet-overlay" onClick={() => setSelectedMobileBus(null)}>
          <div className="admin-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', backgroundColor: '#fff', borderBottom: '1px solid var(--admin-border)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
                {mobileSheetView === 'edit' ? 'Edit Bus' : 'Bus Options'}
              </h3>
              <button onClick={() => {
                if (mobileSheetView === 'edit') setMobileSheetView('details');
                else setSelectedMobileBus(null);
              }} style={{ background: 'none', border: 'none', fontSize: mobileSheetView === 'edit' ? '1rem' : '2rem', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, fontWeight: 600 }}>
                {mobileSheetView === 'edit' ? 'Cancel' : '×'}
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1 }}>
              {mobileSheetView === 'details' ? (
                <>
                  <div style={{ backgroundColor: 'var(--admin-bg-surface)', padding: '20px', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#000', marginBottom: '8px' }}>
                      Bus Name/Number: {selectedMobileBus.busNumber}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--admin-text-secondary)', marginBottom: '24px', lineHeight: 1.4 }}>
                      {getRouteString(selectedMobileBus.routeId)}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Departure</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileBus.departureTime || '-'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Arrival</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileBus.arrivalTime || '-'}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Capacity</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileBus.capacity || 40} seats</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Status</div>
                        <div style={{ display: 'inline-block' }} className={`admin-badge ${(selectedMobileBus.status || 'active') === 'active' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {selectedMobileBus.status || 'active'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                      className="admin-btn admin-btn-primary"
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                      onClick={() => {
                        setEditingBus(selectedMobileBus);
                        setFormData({
                          busNumber: selectedMobileBus.busNumber || '', routeId: selectedMobileBus.routeId || '',
                          departureTime: selectedMobileBus.departureTime || '', arrivalTime: selectedMobileBus.arrivalTime || '',
                          busType: selectedMobileBus.busType || '',
                          status: selectedMobileBus.status || 'active', conductorName: selectedMobileBus.conductorName || '',
                          driverName: selectedMobileBus.driverName || ''
                        });
                        setMobileSheetView('edit');
                      }}
                    >
                      Edit Bus
                    </button>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                      onClick={() => {
                        handleDelete(selectedMobileBus);
                        setSelectedMobileBus(null);
                      }}
                    >
                      Delete Bus
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={(e) => {
                  handleSubmit(e).then(() => {
                    setSelectedMobileBus({ ...selectedMobileBus, ...formData });
                    setMobileSheetView('details');
                  }).catch(err => console.error(err));
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="admin-input-group">
                      <label htmlFor="bus-number-mob" className="admin-label">Bus Name/ Number</label>
                      <input id="bus-number-mob" type="text" className="admin-input" value={formData.busNumber} onChange={e => setFormData({ ...formData, busNumber: e.target.value })} required />
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="route-mob" className="admin-label">Assign Route</label>
                      <select id="route-mob" className="admin-input" value={formData.routeId} onChange={e => setFormData({ ...formData, routeId: e.target.value })} required>
                        <option value="">Select a route...</option>
                        {schedules.map(r => (
                          <option key={r.id} value={r.id}>{r.source} ➔ {r.destination} {r.routeNumber ? `(${r.routeNumber})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-input-group">
                      <label htmlFor="departure-time-mob" className="admin-label">Departure Time</label>
                      <input id="departure-time-mob" type="time" className="admin-input" value={formData.departureTime} onChange={e => setFormData({ ...formData, departureTime: e.target.value })} required />
                    </div>
                    <div className="admin-input-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <label htmlFor="arrival-time-mob" className="admin-label" style={{ marginBottom: 0 }}>Estimated Arrival (Optional)</label>
                        {formData.arrivalTime && (
                          <button type="button" onClick={() => setFormData({ ...formData, arrivalTime: '' })} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Clear</button>
                        )}
                      </div>
                      <input id="arrival-time-mob" type="time" className="admin-input" value={formData.arrivalTime} onChange={e => setFormData({ ...formData, arrivalTime: e.target.value })} style={{ marginTop: '8px' }} />
                    </div>

                    <div className="admin-input-group">
                      <label htmlFor="status-mob" className="admin-label">Status</label>
                      <select id="status-mob" className="admin-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">In Maintenance</option>
                      </select>
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
