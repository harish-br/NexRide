import React, { useState } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import { adminService } from '../services/adminService';

export default function AdminRequests() {
  const { busRequests } = useAdminData();
  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (request) => {
    if (!window.confirm(`Are you sure you want to approve this bus from ${request.source} to ${request.destination} at ${request.departureTime}?`)) return;
    
    setProcessingId(request.id);
    try {
      await adminService.approveBusRequest(request.id);
    } catch (error) {
      console.error(error);
      alert('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    
    setProcessingId(request.id);
    try {
      await adminService.rejectBusRequest(request.id);
    } catch (error) {
      console.error(error);
      alert('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="admin-animate-fade">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem' }}>Approvals</h2>
        <div style={{ color: 'var(--admin-text-secondary)' }}>Review and approve submitted bus timings</div>
      </div>

      {busRequests.length === 0 ? (
        <div className="admin-stat-card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--admin-text-secondary)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#000' }}>No pending requests</h3>
          <p style={{ margin: 0 }}>All submitted bus timings have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {busRequests.map(request => (
            <div key={request.id} className="admin-stat-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                  {request.source} <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 400, margin: '0 8px' }}>➔</span> {request.destination}
                </div>
                <div style={{ display: 'flex', gap: '24px', color: 'var(--admin-text-secondary)', fontSize: '0.9rem' }}>
                  <div><strong style={{ color: '#000' }}>Departure:</strong> {request.departureTime}</div>
                  <div><strong style={{ color: '#000' }}>Arrival:</strong> {request.arrivalTime}</div>
                  <div><strong style={{ color: '#000' }}>Type:</strong> {request.busType}</div>
                  <div><strong style={{ color: '#000' }}>Operator:</strong> {request.operatorName}</div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                  Submitted by {request.submittedBy} on {request.timestamp ? new Date(request.timestamp.toMillis()).toLocaleString() : 'Just now'}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="admin-btn"
                  style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}
                  onClick={() => handleReject(request)}
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? 'Processing...' : 'Reject'}
                </button>
                <button 
                  className="admin-btn admin-btn-primary"
                  style={{ backgroundColor: 'var(--admin-success)', border: 'none' }}
                  onClick={() => handleApprove(request)}
                  disabled={processingId === request.id}
                >
                  {processingId === request.id ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
