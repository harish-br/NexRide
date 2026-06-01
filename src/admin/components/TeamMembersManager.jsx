import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

export default function TeamMembersManager() {
  const [admins, setAdmins] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    role: 'admin',
    email: '',
    mobile: '',
    password: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [fetchedAdmins, fetchedRequests] = await Promise.all([
        adminService.getAdmins(),
        adminService.getAdminRequests()
      ]);
      setAdmins(fetchedAdmins);
      setRequests(fetchedRequests);
    } catch (error) {
      console.error("Error fetching team members data:", error);
      setFetchError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      await adminService.approveAdminRequest(request.id, request.uid, request.email);
      fetchData();
    } catch (error) {
      console.error("Error approving request:", error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (request) => {
    if (!window.confirm(`Are you sure you want to reject ${request.email}?`)) return;
    try {
      await adminService.rejectAdminRequest(request.id, request.email);
      fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert('Failed to reject request');
    }
  };

  const handleRemoveAdmin = async (admin) => {
    if (!window.confirm(`Are you sure you want to remove ${admin.email} from the admin team?`)) return;
    try {
      await adminService.removeAdmin(admin.id, admin.email);
      fetchData();
    } catch (error) {
      console.error("Error removing admin:", error);
      alert(error.message || 'Failed to remove admin');
    }
  };

  const handleAddManual = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    setAdding(true);
    try {
      await adminService.createAdminUserAndRecord(formData);
      setFormData({ name: '', role: 'admin', email: '', mobile: '', password: '' });
      fetchData();
      alert('Team member added successfully!');
    } catch (error) {
      console.error("Error adding admin manually:", error);
      alert(error.message || 'Failed to add admin');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div className="admin-animate-fade" style={{ padding: '20px', color: 'var(--admin-text-secondary)' }}>Loading team members...</div>;
  }

  return (
    <div className="admin-animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ADD MEMBER MANUALLY */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Add Team Member</h2>
        </div>
        <form onSubmit={handleAddManual} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="admin-input-group" style={{ marginBottom: 0 }}>
              <label className="admin-label">Full Name</label>
              <input type="text" className="admin-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="admin-input-group" style={{ marginBottom: 0 }}>
              <label className="admin-label">Role</label>
              <select className="admin-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} required>
                <option value="admin">Administrator</option>
                <option value="super_admin">Super Administrator</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="admin-input-group" style={{ marginBottom: 0 }}>
              <label className="admin-label">Gmail ID / Email</label>
              <input type="email" className="admin-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="admin-input-group" style={{ marginBottom: 0 }}>
              <label className="admin-label">Mobile Number</label>
              <input type="tel" className="admin-input" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} required />
            </div>
          </div>

          <div className="admin-input-group" style={{ marginBottom: 0 }}>
            <label className="admin-label">Initial Password</label>
            <input type="text" className="admin-input" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength={6} />
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '12px 24px', alignSelf: 'flex-start' }} disabled={adding}>
            {adding ? 'Creating Account & Adding...' : 'Add Member'}
          </button>
        </form>
        <div style={{ color: 'var(--admin-text-secondary)', fontSize: '0.85rem', marginTop: '12px' }}>
          * This directly creates a Firebase Authentication account for the new member so they can log in immediately.
        </div>
      </div>
      
      {/* PENDING REQUESTS */}
      {requests.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Pending Join Requests</h2>
            <div style={{ color: 'var(--admin-text-secondary)' }}>{requests.length} requests</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Request Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.email}</td>
                    <td>{req.timestamp?.toDate ? new Date(req.timestamp.toDate()).toLocaleDateString() : 'Unknown'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="admin-btn admin-btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleApprove(req)}
                        >
                          Approve
                        </button>
                        <button 
                          className="admin-btn" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--admin-danger)', border: '1px solid var(--admin-danger)', background: 'transparent' }}
                          onClick={() => handleReject(req)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIVE TEAM MEMBERS */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Team Members</h2>
          <div style={{ color: 'var(--admin-text-secondary)' }}>{admins.length} active</div>
        </div>
        
        {fetchError && (
          <div style={{ padding: '16px', backgroundColor: '#FFEBEB', color: '#D32F2F', borderRadius: '8px', marginBottom: '16px' }}>
            <strong>Error loading members:</strong> {fetchError}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Added Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td style={{ fontWeight: 600 }}>{admin.email}</td>
                  <td>
                    <span className="admin-badge-success" style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {admin.role || 'Admin'}
                    </span>
                  </td>
                  <td>{admin.addedAt?.toDate ? new Date(admin.addedAt.toDate()).toLocaleDateString() : 'Original Admin'}</td>
                  <td>
                    <button 
                      className="admin-btn" 
                      style={{ padding: '6px 12px', fontSize: '0.85rem', color: 'var(--admin-danger)', border: 'none', background: '#fee2e2' }}
                      onClick={() => handleRemoveAdmin(admin)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-secondary)', padding: '24px' }}>
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
