import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProductApprovals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adminPrice, setAdminPrice] = useState('');

  const fetchPendingProducts = async () => {
    try {
      const { data } = await api.get('/admin/products/pending');
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingProducts(); }, []);

  const handleOpenModal = (product) => {
    setSelectedProduct(product);
    setAdminPrice(product.adminPrice || product.wholesalerPrice || '');
    setShowModal(true);
  };

  const handleApprove = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}`, {
        status: 'approved',
        adminPrice: Number(adminPrice),
      });
      toast.success('Product approved!');
      setShowModal(false);
      fetchPendingProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}`, { status: 'rejected' });
      toast.success('Product rejected');
      fetchPendingProducts();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  if (loading) return <div className="text-center py-4">Loading products...</div>;

  return (
    <Container fluid>
      <h4 className="mb-4">📦 Product Approvals</h4>
      <Card className="border-0 shadow-sm">
        <Card.Body>
          {products.length === 0 ? (
            <div className="text-center py-4 text-muted">No pending products</div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Wholesaler</th>
                  <th>Wholesaler Price</th>
                  <th>Admin Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.name}</strong>
                      {product.image && <img src={product.image} alt="" width="40" className="ms-2 rounded" />}
                    </td>
                    <td>{product.wholesaler?.storeName || product.wholesaler?.name || 'N/A'}</td>
                    <td>₹{product.wholesalerPrice || product.price || 0}</td>
                    <td>₹{product.adminPrice || '-'}</td>
                    <td>
                      <Badge bg={product.status === 'pending' ? 'warning' : product.status === 'approved' ? 'success' : 'danger'}>
                        {product.status}
                      </Badge>
                    </td>
                    <td>
                      {product.status === 'pending' && (
                        <>
                          <Button size="sm" variant="success" className="me-1" onClick={() => handleOpenModal(product)}>
                            Approve & Set Price
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(product._id)}>
                            Reject
                          </Button>
                        </>
                      )}
                      {product.status === 'rejected' && (
                        <Button size="sm" variant="outline-success" onClick={() => handleOpenModal(product)}>
                          Reconsider
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Price Setting Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Set Final Price – {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Wholesaler Price: ₹{selectedProduct?.wholesalerPrice || selectedProduct?.price}</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter admin selling price"
              value={adminPrice}
              onChange={(e) => setAdminPrice(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="success" onClick={() => handleApprove(selectedProduct._id)}>
            Approve at ₹{adminPrice}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductApprovals;