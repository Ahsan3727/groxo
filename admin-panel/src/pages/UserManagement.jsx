import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?role=${role}`);
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const handleAction = async (userId, action) => {
    try {
      await api.put(`/admin/users/${userId}`, { action });
      toast.success(`User ${action}ed`);
      fetchUsers();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div>
      <h2>User Management</h2>
      <div style={{ marginBottom:16 }}>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding:8, borderRadius:6 }}>
          <option value="customer">Customers</option>
          <option value="rider">Riders</option>
          <option value="wholesaler">Wholesalers</option>
        </select>
      </div>
      {loading ? <p>Loading...</p> : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#f1f5f9' }}>
              <th>Name</th><th>Phone</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id} style={{ borderBottom:'1px solid #e2e8f0' }}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.phone}</td>
                <td>{user.isActive ? 'Active' : 'Banned'}</td>
                <td>
                  {user.isActive ? (
                    <button onClick={() => handleAction(user._id, 'ban')} style={{ background:'#f44336', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4 }}>Ban</button>
                  ) : (
                    <button onClick={() => handleAction(user._id, 'unban')} style={{ background:'#4CAF50', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4 }}>Unban</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
