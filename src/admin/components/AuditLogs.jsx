import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminService } from '../services/adminService';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mobile state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [selectedMobileLog, setSelectedMobileLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs(100);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action) => {
    if (action.startsWith('ADD_')) return 'var(--admin-success)';
    if (action.startsWith('DELETE_')) return 'var(--admin-danger)';
    if (action.startsWith('UPDATE_')) return 'var(--admin-accent)';
    return 'var(--admin-text-secondary)';
  };

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <p style={{ color: 'var(--admin-text-secondary)', margin: 0, flex: '1 1 200px' }}>
          Viewing recent system activities and modifications.
        </p>
        <button className="admin-btn" style={{ flex: '0 0 auto' }} onClick={fetchLogs}>
          Refresh Logs
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--admin-text-secondary)' }}>Loading audit logs...</div>
      ) : isMobile ? (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.length === 0 ? (
              <div className="admin-animate-fade" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '48px 24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <img src="/NexRide%20AO.png" alt="NexRide" style={{ height: '40px', opacity: 0.2, filter: 'grayscale(100%)' }} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '8px' }}>No logs found</div>
              </div>
            ) : (
              logs.map(log => {
                let timeString = 'Unknown';
                if (log.timestamp && log.timestamp.toDate) {
                  timeString = log.timestamp.toDate().toLocaleString();
                }
                return (
                  <div 
                    key={log.id} 
                    className="admin-stat-card" 
                    style={{ padding: '20px', cursor: 'pointer', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}
                    onClick={() => setSelectedMobileLog({ ...log, timeString })}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000', marginBottom: '4px' }}>
                        <span style={{ color: getActionColor(log.action) }}>{log.action}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
                        By: <span style={{ fontWeight: 600 }}>{log.adminEmail}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{timeString}</span>
                        • Tap to view details
                      </div>
                    </div>
                    <div style={{ color: 'var(--admin-accent)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No logs found</td>
                </tr>
              ) : (
                logs.map(log => {
                  let timeString = 'Unknown';
                  if (log.timestamp && log.timestamp.toDate) {
                    timeString = log.timestamp.toDate().toLocaleString();
                  }
                  
                  return (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem' }}>{timeString}</td>
                      <td style={{ fontWeight: 500 }}>{log.adminEmail}</td>
                      <td>
                        <span style={{ 
                          color: getActionColor(log.action),
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: 'var(--admin-text-secondary)' }}>{log.details}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Bottom Sheet for Log Details */}
      {selectedMobileLog && createPortal(
        <div className="admin-bottom-sheet-overlay" onClick={() => setSelectedMobileLog(null)}>
          <div className="admin-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', backgroundColor: '#fff', borderBottom: '1px solid var(--admin-border)', position: 'sticky', top: 0, zIndex: 10 }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#000' }}>
                Log Details
              </h3>
              <button onClick={() => setSelectedMobileLog(null)} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: '#000', padding: 0, lineHeight: 1, fontWeight: 600 }}>
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', flex: 1 }}>
              <div style={{ backgroundColor: 'var(--admin-bg-surface)', padding: '20px', borderRadius: '12px', marginBottom: '32px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: getActionColor(selectedMobileLog.action), marginBottom: '24px' }}>
                  {selectedMobileLog.action}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Timestamp</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileLog.timeString}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Admin</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{selectedMobileLog.adminEmail}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)', marginBottom: '4px' }}>Details</div>
                    <div style={{ fontWeight: 500, fontSize: '1rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {selectedMobileLog.details || '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
