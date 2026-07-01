import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Row, Col, Card, Badge, Modal, Form, Button, Spinner,
} from 'react-bootstrap';
import api from '../services/api';
import { toast } from 'react-toastify';
import axios from 'axios';   // add this at the top of the file

const ProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);   // file object
  const [newImagePreview, setNewImagePreview] = useState(''); // preview URL
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

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
    setNewImageFile(null);
    setNewImagePreview('');
    setShowImageModal(true);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

 const handleSaveImage = async () => {
  if (!selectedProduct) return;
  if (!newImageFile) {
    toast.error('Please select an image first');
    return;
  }

  setSaving(true);
  try {
    const formData = new FormData();
    formData.append('productImage', newImageFile);

    // Use the existing `api` instance – it will automatically attach the token
    await api.put(`/admin/products/${selectedProduct._id}/image`, formData, {
      headers: {
        // Let Axios set the content-type automatically (multipart with boundary)
        'Content-Type': 'multipart/form-data',
      },
      // Prevent Axios from trying to convert the FormData to JSON
      transformRequest: [(data) => data],
    });

    toast.success('Image updated');
    setShowImageModal(false);
    fetchProducts();
  } catch (err) {
    console.error('Image upload error:', err.response?.data || err.message);
    toast.error(err.response?.data?.message || 'Failed to update image');
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

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-4 text-muted">No products yet</div>
      ) : (
        Object.keys(grouped).map(category => (
          <div key={category} className="mb-5">
            <h5 className="mb-3 text-capitalize fw-bold">{category}</h5>
            <Row>
              {grouped[category].map(product => (
                <Col key={product._id} md={3} className="mb-4">
                  <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                    {/* 1:1 image frame */}
                    <div
                      className="position-relative"
                      style={{
                        paddingTop: '100%',
                        overflow: 'hidden',
                        backgroundColor: '#f8f9fa',
                      }}
                    >
                      <img
                        src={product.image || 'https://via.placeholder.com/300?text=No+Image'}
                        alt={product.name}
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                    </div>
                    <Card.Body className="d-flex flex-column">
                      <h6 className="fw-bold text-truncate">{product.name}</h6>
                      <p className="small text-muted mb-2">
                        Wholesaler:{' '}
                        <Badge bg="warning" text="dark">
                          {product.wholesaler?.storeName || product.wholesaler?.name || 'N/A'}
                        </Badge>
                      </p>
                      <div className="mb-1">
                        <span className="text-muted me-2">Wholesale:</span>
                        <span className="fw-semibold">Rs. {product.price}</span>
                      </div>
                      <div className="mb-1">
                        <span className="text-muted me-2">Retail:</span>
                        <span className="fw-semibold">{product.retailPrice ? `Rs. ${product.retailPrice}` : '-'}</span>
                      </div>
                      <div className="mb-1">
                        <span className="text-muted me-2">Admin:</span>
                        <span className="fw-semibold">{product.adminPrice ? `Rs. ${product.adminPrice}` : '-'}</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-muted me-2">Stock:</span>
                        <span className="fw-semibold">{product.stock} {product.unit}</span>
                      </div>
                      <div className="mb-2">
                        <Badge bg={product.isApproved ? 'success' : 'secondary'}>
                          {product.isApproved ? 'Approved' : product.status}
                        </Badge>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="mt-auto w-100 rounded-pill"
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
        ))
      )}

      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        capture // optional: on mobile devices, allows camera capture
      />

      {/* Image Edit Modal */}
      <Modal show={showImageModal} onHide={() => setShowImageModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product Image – {selectedProduct?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            {/* Preview area */}
            <div
              style={{
                width: '300px',
                height: '300px',
                margin: '0 auto',
                overflow: 'hidden',
                borderRadius: '12px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {newImagePreview ? (
                <img src={newImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : selectedProduct?.image ? (
                <img
                  src={selectedProduct.image}
                  alt="Current"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <span className="text-muted">No image</span>
              )}
            </div>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <Button variant="primary" onClick={triggerFileInput}>
              📁 Choose File
            </Button>
            <Button variant="outline-secondary" onClick={() => {
              // Option: capture from camera (mobile) – same file input with capture attribute
              triggerFileInput();
            }}>
              📷 Take Photo
            </Button>
          </div>
          <p className="text-center mt-2 text-muted small">
            Supported formats: JPG, PNG, GIF (max 5MB)
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImageModal(false)}>Cancel</Button>
          <Button variant="success" onClick={handleSaveImage} disabled={!newImageFile || saving}>
            {saving ? <Spinner size="sm" animation="border" /> : 'Upload & Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProductCatalog;