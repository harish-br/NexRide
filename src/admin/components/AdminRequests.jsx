import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function AdminRequests() {
  const { busRequests } = useAdminData();
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  
  // Filtering and Sorting State
  const [filterVerified, setFilterVerified] = useState('All'); // 'All', 'Verified', 'Unverified'
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [sortOrder, setSortOrder] = useState('Newest'); // 'Newest', 'Oldest'

  // Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);

  const handleApprove = async (request) => {
    if (!window.confirm(`Are you sure you want to approve this bus from ${request.source} to ${request.destination} at ${request.departureTime}?`)) return;
    
    setProcessingId(request.id);
    setProcessingAction('approve');
    try {
      await adminService.approveBusRequest(request.id);
      setSelectedRequest(null);
    } catch (error) {
      console.error(error);
      alert('Failed to approve request');
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    setProcessingId(request.id);
    setProcessingAction('reject');
    try {
      await adminService.rejectBusRequest(request.id);
      setSelectedRequest(null);
    } catch (error) {
      console.error(error);
      alert('Failed to reject request');
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  // Derive filter options
  const districts = useMemo(() => {
    const dists = new Set();
    busRequests.forEach(req => {
      if (req.location?.district) dists.add(req.location.district);
    });
    return Array.from(dists).sort();
  }, [busRequests]);

  const cities = useMemo(() => {
    const cits = new Set();
    busRequests.forEach(req => {
      if (req.location?.city) cits.add(req.location.city);
    });
    return Array.from(cits).sort();
  }, [busRequests]);

  // Process data
  const processedRequests = useMemo(() => {
    let filtered = busRequests.filter(req => {
      if (filterVerified === 'Verified' && req.location?.verificationStatus !== 'Location Verified') return false;
      if (filterVerified === 'Unverified' && req.location?.verificationStatus === 'Location Verified') return false;
      
      if (filterDistrict !== 'All' && req.location?.district !== filterDistrict) return false;
      if (filterCity !== 'All' && req.location?.city !== filterCity) return false;
      
      return true;
    });

    filtered.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return sortOrder === 'Newest' ? timeB - timeA : timeA - timeB;
    });

    return filtered;
  }, [busRequests, filterVerified, filterDistrict, filterCity, sortOrder]);

  const getTrustIndicator = (location) => {
    if (!location) return { color: 'var(--admin-danger)', text: 'No Location Data', badge: 'admin-badge-danger' };
    if (location.permissionStatus === 'Denied') return { color: 'var(--admin-danger)', text: 'Location Unverified', badge: 'admin-badge-danger' };
    if (location.accuracy > 500) return { color: 'var(--admin-warning)', text: 'Approximate Location', badge: 'admin-badge-warning' };
    return { color: 'var(--admin-success)', text: 'Location Verified', badge: 'admin-badge-success' };
  };

  return (
    <div className="admin-animate-fade" style={{ paddingBottom: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.75rem', letterSpacing: '-0.02em', color: '#111' }}>Approvals</h2>
        <div style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.4' }}>Review and approve submitted bus timings with location verification</div>
      </div>

      <div className="admin-stat-card" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        marginBottom: '24px', 
        padding: '16px', 
        border: 'none',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: '#374151' }}>Verification Status</label>
          <select className="admin-input" value={filterVerified} onChange={e => setFilterVerified(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}>
            <option value="All">All Statuses</option>
            <option value="Verified">Verified Location</option>
            <option value="Unverified">Unverified Location</option>
          </select>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: '#374151' }}>District</label>
            <select className="admin-input" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}>
              <option value="All">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: '#374151' }}>City</label>
            <select className="admin-input" value={filterCity} onChange={e => setFilterCity(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}>
              <option value="All">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: '#374151' }}>Sort By</label>
            <select className="admin-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '0.85rem' }}>
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {processedRequests.length === 0 ? (
        <div className="admin-stat-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--admin-text-secondary)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#000' }}>No pending requests</h3>
          <p style={{ margin: 0 }}>There are no reports matching your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {processedRequests.map(request => {
            const trust = getTrustIndicator(request.location);
            return (
              <div 
                key={request.id} 
                className="admin-stat-card" 
                style={{ 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: '#fff',
                  border: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)'
                }}
                onClick={() => setSelectedRequest(request)}
              >
                {/* Route Header */}
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#111', lineHeight: '1.3' }}>
                  {request.source} <span style={{ color: '#9CA3AF', margin: '0 6px', fontWeight: 400 }}>➔</span> {request.destination}
                </div>

                {/* Content Split: Left (Bus Info) / Right (Verification Info) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px', gap: '12px' }}>
                  
                  {/* Left Column: Route Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: '#4B5563' }}>
                    <div><span style={{ fontWeight: 600, color: '#111', width: '70px', display: 'inline-block' }}>Departure:</span> {request.departureTime}</div>
                    <div><span style={{ fontWeight: 600, color: '#111', width: '70px', display: 'inline-block' }}>Arrival:</span> {request.arrivalTime || 'N/A'}</div>
                    <div><span style={{ fontWeight: 600, color: '#111', width: '70px', display: 'inline-block' }}>Bus:</span> {request.busName || request.busType}</div>
                  </div>

                  {/* Right Column: Verification & Report Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', textAlign: 'right' }}>
                    <div className={`admin-badge ${trust.badge}`} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', fontSize: '0.7rem', fontWeight: 600, borderRadius: '6px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: trust.color, marginRight: '6px' }}></span>
                      {trust.text}
                    </div>
                    
                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>
                      {request.timestamp ? new Date(request.timestamp.toMillis()).toLocaleString() : 'Just now'}
                    </div>

                    {(request.location?.city || request.location?.accuracy) && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-end',
                        gap: '2px', 
                        marginTop: '4px'
                      }}>
                        {request.location?.city && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#4B5563', fontWeight: 500 }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                              <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            {request.location.city}
                          </div>
                        )}
                        {request.location?.accuracy && (
                          <div style={{ fontSize: '0.65rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <circle cx="12" cy="12" r="4"></circle>
                              <line x1="22" y1="12" x2="18" y2="12"></line>
                              <line x1="6" y1="12" x2="2" y2="12"></line>
                              <line x1="12" y1="6" x2="12" y2="2"></line>
                              <line x1="12" y1="22" x2="12" y2="18"></line>
                            </svg>
                            ±{Math.round(request.location.accuracy)}m accuracy
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    className="admin-btn"
                    style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)', padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); handleReject(request); }}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id && processingAction === 'reject' ? 'Processing...' : 'Reject'}
                  </button>
                  <button 
                    className="admin-btn admin-btn-primary"
                    style={{ backgroundColor: 'var(--admin-success)', border: 'none', padding: '10px', fontSize: '0.85rem', justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); handleApprove(request); }}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id && processingAction === 'approve' ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Details Modal */}
      {selectedRequest && createPortal(
        <div className="admin-modal-overlay" onClick={() => setSelectedRequest(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-modal admin-animate-fade" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-modal-title">Approval Details</h3>
              <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
            </div>
            
            <div className="admin-modal-body" style={{ overflowY: 'auto', padding: '24px' }}>
              {/* Bus Details Section */}
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px' }}>Reported Bus Info</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Route:</span> <strong style={{ display: 'block' }}>{selectedRequest.source} ➔ {selectedRequest.destination}</strong></div>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Via:</span> <strong style={{ display: 'block' }}>{selectedRequest.via || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Departure:</span> <strong style={{ display: 'block' }}>{selectedRequest.departureTime}</strong></div>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Arrival:</span> <strong style={{ display: 'block' }}>{selectedRequest.arrivalTime || 'N/A'}</strong></div>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Bus/Type:</span> <strong style={{ display: 'block' }}>{selectedRequest.busName || selectedRequest.busType}</strong></div>
                <div><span style={{ color: 'var(--admin-text-secondary)' }}>Operator:</span> <strong style={{ display: 'block' }}>{selectedRequest.operatorName}</strong></div>
              </div>

              {/* Location Verification Section */}
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--admin-border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Location Verification
                <span className={`admin-badge ${getTrustIndicator(selectedRequest.location).badge}`} style={{ fontSize: '0.75rem' }}>
                  {getTrustIndicator(selectedRequest.location).text}
                </span>
              </h4>
              
              {!selectedRequest.location ? (
                <div style={{ color: 'var(--admin-danger)', padding: '16px', backgroundColor: '#fff0f0', borderRadius: '8px' }}>
                  No location data was captured for this report.
                </div>
              ) : selectedRequest.location.permissionStatus === 'Denied' ? (
                <div style={{ color: 'var(--admin-danger)', padding: '16px', backgroundColor: '#fff0f0', borderRadius: '8px' }}>
                  <strong>Warning:</strong> The user denied location access. Location is unverified.
                  <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                    Submitted by: {selectedRequest.submittedBy} (Device: {selectedRequest.location.deviceType})
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>Detected Area:</span> <strong style={{ display: 'block' }}>{selectedRequest.location.detectedArea || 'Unknown'}</strong></div>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>City/District:</span> <strong style={{ display: 'block' }}>{selectedRequest.location.city || selectedRequest.location.district || 'Unknown'}</strong></div>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>Accuracy:</span> <strong style={{ display: 'block' }}>±{Math.round(selectedRequest.location.accuracy || 0)} meters</strong></div>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>Coordinates:</span> <strong style={{ display: 'block' }}>{selectedRequest.location.latitude?.toFixed(5)}, {selectedRequest.location.longitude?.toFixed(5)}</strong></div>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>User Email:</span> <strong style={{ display: 'block' }}>{selectedRequest.submittedBy}</strong></div>
                    <div><span style={{ color: 'var(--admin-text-secondary)' }}>Device Type:</span> <strong style={{ display: 'block' }}>{selectedRequest.location.deviceType}</strong></div>
                  </div>
                  
                  <div style={{ marginTop: '8px', overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--admin-border)', position: 'relative' }}>
                    <iframe 
                      title="User Location Map"
                      width="100%" 
                      height="250" 
                      style={{ border: 0, display: 'block' }} 
                      loading="lazy" 
                      allowFullScreen 
                      src={`https://www.google.com/maps?q=${selectedRequest.location.latitude},${selectedRequest.location.longitude}&z=15&output=embed`}
                    ></iframe>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedRequest.location.latitude},${selectedRequest.location.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="admin-btn"
                      style={{ position: 'absolute', bottom: '16px', right: '16px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            <div className="admin-modal-footer" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px', 
              backgroundColor: 'var(--admin-bg-surface)' 
            }}>
              <button 
                className="admin-btn"
                style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)', padding: '12px', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}
                onClick={() => handleReject(selectedRequest)}
                disabled={processingId === selectedRequest.id}
              >
                {processingId === selectedRequest.id && processingAction === 'reject' ? 'Processing...' : 'Reject'}
              </button>
              <button 
                className="admin-btn admin-btn-primary"
                style={{ backgroundColor: 'var(--admin-success)', border: 'none', padding: '12px', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}
                onClick={() => handleApprove(selectedRequest)}
                disabled={processingId === selectedRequest.id}
              >
                {processingId === selectedRequest.id && processingAction === 'approve' ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
