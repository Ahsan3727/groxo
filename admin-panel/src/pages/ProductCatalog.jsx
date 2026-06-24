import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Modal, Form, Button, Spinner } from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/admin/products');
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Group by category
  const grouped = products.reduce((acc, product) => {
    const cat = product.category || 'Uncategorised';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  const openImageModal = (product) => {
    setSelectedProduct(product);
    setNewImageUrl(product.image || '');
    setShowImageModal(true);
  };

  const handleSaveImage = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await api.put(`/admin/products/${selectedProduct._id}`, { image: newImageUrl });
      toast.success('Image updated');
      setShowImageModal(false);
      fetchProducts(); // refresh
    } catch (err) {
      toast.error('Failed to update image');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading catalog...</p>
      </div>
    );
  }

  return (
    <Container fluid>
      <h4 className="mb-4">📦 Product Catalog</h4>

      {Object.keys(grouped).map(category => (
        <div key={category} className="mb-4">
          <h5 className="mb-3 text-capitalize">{category}</h5>
          <Row>
            {grouped[category].map(product => (
              <Col key={product._id} md={3} className="mb-3">
                <Card className="h-100 shadow-sm border-0">
                  {/* 1:1 image frame */}
                  <div className="position-relative" style={{ paddingTop: '100%', overflow: 'hidden' }}>
                    <img
                      src={product.image || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.name}
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <Card.Body>
                    <h6 className="fw-bold">{product.name}</h6>
                    <p className="small text-muted mb-1">
                      Wholesaler:{' '}
                      <Badge bg="warning" text="dark">
                        {product.wholesaler?.storeName || product.wholesaler?.name || 'N/A'}
                      </Badge>
                    </p>
                    <p className="mb-1"><strong>Price:</strong> Rs. {product.price}</p>
                    <p className="mb-1"><strong>Stock:</strong> {product.stock} {product.unit}</p>
                    <Badge bg={product.isApproved ? 'success' : 'secondary'}>
                      {product.isApproved ? 'Approved' : product.status}
                    </Badge>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="mt-2 w-100"
                      onClick={() => openImageModal(product)}
                    >
                      🖼️ Edit Image
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Image Edit Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Image URL</Form.Label>
            <Form.Control
              type="text"
              placeholder="https://..."
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
            />
          </Form.Group>
          {newImageUrl && (
            <div className="mt-3 text-center">
              <div style={{ width: '200px', height: '200px', margin: '0 auto', overflow: 'hidden', borderRadius: '8px' }}>
                <img
                  src={newImageUrl}
                  alt="Preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200?text=Invalid+URL'; }}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveImage} disabled={saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductCatalog;