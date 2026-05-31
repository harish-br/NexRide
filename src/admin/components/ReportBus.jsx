import React, { useState } from 'react';
import { adminService } from '../services/adminService';

export default function ReportBus({ setCurrentView }) {
  const [reportData, setReportData] = useState({
    source: '',
    destination: '',
    departureTime: '',
    arrivalTime: '',
    busName: '',
    operatorName: 'Government'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.submitBusRequest(reportData);
      alert('Bus timing reported successfully! It is now pending admin approval.');
      setReportData({ source: '', destination: '', departureTime: '', arrivalTime: '', busName: '', operatorName: 'Government' });
      if (setCurrentView) setCurrentView('dashboard');
    } catch (error) {
      console.error(error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-animate-fade">
      <div style={{ maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid var(--admin-border)', paddingBottom: '16px' }}>Report Bus Timing</h2>
          <p style={{ color: 'var(--admin-text-secondary)', marginBottom: '32px' }}>Submit new bus timings for admin approval. Please ensure all details are accurate before submitting.</p>

          <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div className="admin-input-group">
                <label className="admin-label">Source City</label>
                <input type="text" className="admin-input" value={reportData.source} onChange={e => setReportData({...reportData, source: e.target.value})} required placeholder="e.g. Erode" />
              </div>
              
              <div className="admin-input-group">
                <label className="admin-label">Destination City</label>
                <input type="text" className="admin-input" value={reportData.destination} onChange={e => setReportData({...reportData, destination: e.target.value})} required placeholder="e.g. Coimbatore" />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div className="admin-input-group">
                <label className="admin-label">Departure Time</label>
                <input type="time" className="admin-input" value={reportData.departureTime} onChange={e => setReportData({...reportData, departureTime: e.target.value})} required />
              </div>
              <div className="admin-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="admin-label">Arrival Time <span style={{ color: 'var(--admin-text-secondary)', fontWeight: 'normal', fontSize: '0.85em' }}>(Optional)</span></label>
                  {reportData.arrivalTime && (
                    <button type="button" onClick={() => setReportData({...reportData, arrivalTime: ''})} style={{ background: 'none', border: 'none', color: 'var(--admin-danger)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>Clear</button>
                  )}
                </div>
                <input type="time" className="admin-input" value={reportData.arrivalTime} onChange={e => setReportData({...reportData, arrivalTime: e.target.value})} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
              <div className="admin-input-group">
                <label className="admin-label">Bus Name</label>
                <input type="text" className="admin-input" value={reportData.busName} onChange={e => setReportData({...reportData, busName: e.target.value})} required placeholder="e.g. TNSTC Super Fast" />
              </div>
              <div className="admin-input-group">
                <label className="admin-label">Operator</label>
                <select className="admin-input" value={reportData.operatorName} onChange={e => setReportData({...reportData, operatorName: e.target.value})}>
                  <option value="Government">Government (TNSTC/SETC)</option>
                  <option value="Private">Private</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', borderTop: '1px solid var(--admin-border)', paddingTop: '24px' }}>
              <button type="button" className="admin-btn" style={{ flex: 1, padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }} onClick={() => setCurrentView && setCurrentView('dashboard')}>
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 2, padding: '16px', fontSize: '1.1rem', borderRadius: '12px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
