import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    api.get(`/admin/orders?status=${statusFilter}`)
      .then(res => setOrders(res.data.orders || []))
      .catch(() => toast.error('Failed to fetch orders'));
  }, [statusFilter]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status: newStatus });
      toast.success('Order updated');
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err) {
      toast.error('Update failed');
    }
  };

  return (
    <div>
      <h2>Order Management</h2>
      <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding:8, borderRadius:6, marginBottom:16 }}>
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr style={{ background:'#f1f5f9' }}><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {orders.map(order => (
            <tr key={order._id} style={{ borderBottom:'1px solid #e2e8f0' }}>
              <td>{order._id?.slice(-6)}</td>
              <td>{order.customer?.name || 'N/A'}</td>
              <td>₹{order.total}</td>
              <td>{order.status}</td>
              <td>
                {order.status === 'pending' && <button onClick={() => updateStatus(order._id, 'accepted')} style={{ background:'#2196F3', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4, marginRight:4 }}>Accept</button>}
                {order.status === 'accepted' && <button onClick={() => updateStatus(order._id, 'delivered')} style={{ background:'#4CAF50', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4, marginRight:4 }}>Delivered</button>}
                <button onClick={() => updateStatus(order._id, 'cancelled')} style={{ background:'#f44336', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4 }}>Cancel</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderManagement;
