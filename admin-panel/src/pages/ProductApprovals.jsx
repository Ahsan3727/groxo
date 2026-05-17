import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProductApprovals = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/admin/products/pending').then(res => setProducts(res.data.products || [])).catch(() => {});
  }, []);

  const handleAction = async (productId, action) => {
    try {
      await api.put(`/admin/products/${productId}`, { action });
      toast.success(`Product ${action}ed`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  return (
    <div>
      <h2>Product Approvals</h2>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead><tr style={{ background:'#f1f5f9' }}><th>Name</th><th>Wholesaler</th><th>Price</th><th>Actions</th></tr></thead>
        <tbody>
          {products.map(prod => (
            <tr key={prod._id} style={{ borderBottom:'1px solid #e2e8f0' }}>
              <td>{prod.name}</td>
              <td>{prod.wholesaler?.name || 'N/A'}</td>
              <td>₹{prod.price}</td>
              <td>
                <button onClick={() => handleAction(prod._id, 'approve')} style={{ background:'#4CAF50', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4, marginRight:4 }}>Approve</button>
                <button onClick={() => handleAction(prod._id, 'reject')} style={{ background:'#f44336', color:'#fff', border:'none', padding:'4px 8px', borderRadius:4 }}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductApprovals;
