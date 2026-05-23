import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Row, Col, Card, Form, Badge, Button,
  InputGroup, ListGroup, Spinner, Modal
} from 'react-bootstrap';
import {
  MapContainer, TileLayer, Marker, Popup, Circle, Polyline,
  useMap, ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { toast } from 'react-toastify';

// --------------------------------------------------------------------
// 1. Fix Leaflet default icon issue
// --------------------------------------------------------------------
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --------------------------------------------------------------------
// 2. Custom icons based on rider status
// --------------------------------------------------------------------
const createRiderIcon = (status) => {
  const colors = {
    online: '#4CAF50',
    offline: '#9E9E9E',
    busy: '#FF9800',
    inactive: '#f44336',
    customer: '#2196F3',
    wholesaler: '#FF9800', // orange
  };
  const color = colors[status] || '#9E9E9E';
  let emoji = '🛵';
  if (status === 'customer') emoji = '🛒';
  else if (status === 'wholesaler') emoji = '🏭';

  return L.divIcon({
    className: 'custom-rider-icon',
    html: `<div style="
      width: 40px; height: 40px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; color: white; font-weight: bold;
    ">${emoji}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Hub location icon
const hubIcon = L.divIcon({
  className: 'hub-icon',
  html: `<div style="
    width: 50px; height: 50px;
    background: #2196F3;
    border-radius: 50%;
    border: 4px solid white;
    box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: white;
  ">🏪</div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -50],
});

// --------------------------------------------------------------------
// 3. Auto‑center map component
// --------------------------------------------------------------------
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 14, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

// --------------------------------------------------------------------
// 4. Main HubMap Component
// --------------------------------------------------------------------
const HubMap = () => {
  // ---------- State ----------
  const [riders, setRiders] = useState([]);
  const [filteredRiders, setFilteredRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRider, setSelectedRider] = useState(null);
  const [showRiderModal, setShowRiderModal] = useState(false);

  // Map focus
  const [mapCenter, setMapCenter] = useState([31.72, 72.98]); // Chiniot, Punjab
  const [mapZoom, setMapZoom] = useState(14);

  // Auto‑refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // seconds
  const intervalRef = useRef(null);

  // Hub & paths
  const hubLocation = { lat: 31.72, lng: 72.98 };
  const [riderPaths, setRiderPaths] = useState({});

  // ---------- Derived safe array for map markers ----------
  const ridersWithLocation = filteredRiders.filter(
    (rider) => rider.location?.lat != null && rider.location?.lng != null
  );

  // ---------- Fetch riders from backend ----------
  const fetchAllLocations = useCallback(async () => {
  try {
    const [ridersRes, customersRes, wholesalersRes] = await Promise.all([
      api.get('/admin/riders/locations'),
      api.get('/admin/customers/locations'),
      api.get('/admin/wholesalers/locations'),
    ]);

    const ridersData = (ridersRes.data || []).map(r => ({
      ...r,
      type: 'rider',
      location: r.currentLocation || null,
    }));
    const customersData = (customersRes.data || []).map(c => ({
      ...c,
      type: 'customer',
      location: c.currentLocation || null,
      vehicle: { type: 'Customer' },
      status: 'customer',
    }));
    const wholesalersData = (wholesalersRes.data || []).map(w => ({
      ...w,
      type: 'wholesaler',
      location: w.currentLocation || null,
      vehicle: { type: 'Store' },
      status: 'wholesaler',
    }));

    const allUsers = [...ridersData, ...customersData, ...wholesalersData];
    setRiders(allUsers);
    setFilteredRiders(allUsers);

    // paths only for riders (optional)
    const paths = {};
    allUsers.forEach(user => {
      if (user.path && user.path.length > 1) {
        paths[user._id] = user.path.map(p => [p.lat, p.lng]);
      }
    });
    setRiderPaths(paths);
  } catch (error) {
    console.error('Fetch locations error', error);
    toast.error('Could not load locations');
  } finally {
    setLoading(false);
  }
}, []);

  // ---------- Initial load & auto‑refresh ----------
  useEffect(() => {
    fetchAllLocations();
  }, [fetchAllLocations]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAllLocations, refreshInterval * 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, refreshInterval, fetchAllLocations]);

  // ---------- Filtering ----------
  useEffect(() => {
    let filtered = [...riders];

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(s) ||
          r.email?.toLowerCase().includes(s) ||
          (r.vehicle?.plateNumber || '').toLowerCase().includes(s)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRiders(filtered);
  }, [searchTerm, statusFilter, riders]);

  // ---------- Handlers ----------
  const handleRiderClick = (rider) => {
    if (!rider?.location?.lat) return;
    setSelectedRider(rider);
    setMapCenter([rider.location.lat, rider.location.lng]);
    setMapZoom(16);
    setShowRiderModal(true);
  };

  const handleListItemClick = (rider) => {
    if (!rider?.location?.lat) return;
    setSelectedRider(rider);
    setMapCenter([rider.location.lat, rider.location.lng]);
    setMapZoom(16);
  };

  // ---------- Helpers ----------
 const statusBadge = (status) => {
  const map = {
    online: { bg: 'success', text: 'Online' },
    offline: { bg: 'secondary', text: 'Offline' },
    busy: { bg: 'warning', text: 'Busy' },
    inactive: { bg: 'danger', text: 'Inactive' },
    customer: { bg: 'info', text: 'Customer' },
    wholesaler: { bg: 'warning', text: 'Wholesaler' },
  };
  const s = map[status] || map.offline;
  return <Badge bg={s.bg}>{s.text}</Badge>;
};

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // ---------- Stats ----------
  const onlineCount = riders.filter((r) => r.status === 'online').length;
  const busyCount = riders.filter((r) => r.status === 'busy').length;
  const customerCount = riders.filter(r => r.type === 'customer').length;
  const offlineCount = riders.filter((r) => r.status === 'offline').length;

  // ---------- Loading state ----------
  if (loading) {
    return (
      <Container fluid className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted">Loading rider locations...</p>
        </div>
      </Container>
    );
  }

  // ---------- Render ----------
  return (
    <Container fluid className="p-0">
      {/* ----- Stats Bar ----- */}
      <Row className="g-3 mb-3 px-3">
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #4CAF50' }}>
            <Card.Body className="py-2 px-3">
              <small className="text-muted">Online Riders</small>
              <h4 className="mb-0 fw-bold text-success">{onlineCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
  <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #FF9800' }}>
    <Card.Body className="py-2 px-3">
      <small className="text-muted">Wholesalers</small>
      <h4 className="mb-0 fw-bold text-warning">
        {riders.filter(r => r.type === 'wholesaler').length}
      </h4>
    </Card.Body>
  </Card>
</Col>
          <Col md={3}>
  <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #2196F3' }}>
    <Card.Body className="py-2 px-3">
      <small className="text-muted">Customers</small>
      <h4 className="mb-0 fw-bold text-info">{customerCount}</h4>
    </Card.Body>
  </Card>
</Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #FF9800' }}>
            <Card.Body className="py-2 px-3">
              <small className="text-muted">Busy (Delivering)</small>
              <h4 className="mb-0 fw-bold text-warning">{busyCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #9E9E9E' }}>
            <Card.Body className="py-2 px-3">
              <small className="text-muted">Offline</small>
              <h4 className="mb-0 fw-bold text-secondary">{offlineCount}</h4>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #2196F3' }}>
            <Card.Body className="py-2 px-3">
              <small className="text-muted">Total Riders</small>
              <h4 className="mb-0 fw-bold text-primary">{riders.length}</h4>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ----- Controls Bar ----- */}
      <Row className="mb-3 px-3">
        <Col md={4}>
          <InputGroup>
            <InputGroup.Text className="bg-white">🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search rider name, email, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="online">🟢 Online</option>
            <option value="busy">🟠 Busy</option>
            <option value="offline">⚫ Offline</option>
            <option value="inactive">🔴 Inactive</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="switch"
              label="Auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            {autoRefresh && (
              <Form.Select
                size="sm"
                style={{ width: '80px' }}
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
              >
                <option value="5">5s</option>
                <option value="10">10s</option>
                <option value="30">30s</option>
                <option value="60">60s</option>
              </Form.Select>
            )}
          </div>
        </Col>
        <Col md={2} className="text-end">
          <Button variant="outline-primary" onClick={fetchAllLocations}>
            🔄 Refresh
          </Button>
        </Col> 
      </Row>

      {/* ----- Map & Sidebar ----- */}
      <Row className="px-3" style={{ height: 'calc(100vh - 280px)' }}>
        {/* Sidebar: Rider List */}
        <Col md={3}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-bottom">
              <strong>Riders ({filteredRiders.length})</strong>
            </Card.Header>
            <Card.Body className="p-0 overflow-auto">
              <ListGroup variant="flush">
                {filteredRiders.length === 0 ? (
                  <div className="text-center py-4 text-muted">No riders found</div>
                ) : (
                  filteredRiders.map((rider) => (
                    <ListGroup.Item
                      key={rider._id}
                      className={`cursor-pointer ${selectedRider?._id === rider._id ? 'bg-light' : ''}`}
                      onClick={() => handleListItemClick(rider)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold">{rider.name}</div>
                          <small className="text-muted">{rider.vehicle?.plateNumber || 'N/A'}</small>
                        </div>
                        {statusBadge(rider.status)}
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">⭐ {rider.rating || 'N/A'}</small>
                        <small className="text-muted">
                          📍 {rider.lastLocationUpdate ? formatTime(rider.lastLocationUpdate) : 'No data'}
                        </small>
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Map */}
        <Col md={9}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body className="p-0 position-relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                zoomControl={false}
              >
                {/* English tile layer (no Urdu) */}
                <TileLayer
                  url="https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a> | Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <ZoomControl position="topright" />
                <MapController center={mapCenter} zoom={mapZoom} />

                {/* Hub Marker */}
                <Marker position={[hubLocation.lat, hubLocation.lng]} icon={hubIcon}>
                  <Popup>
                    <strong>🏪 Groxo Hub</strong>
                    <br />
                    <small>Main Distribution Center – Chiniot</small>
                  </Popup>
                </Marker>

                {/* Hub Radius (optional visual) */}
                <Circle
                  center={[hubLocation.lat, hubLocation.lng]}
                  radius={2000}
                  pathOptions={{ color: '#2196F3', fillColor: '#2196F3', fillOpacity: 0.1 }}
                />

                {/* Rider Markers (only those with location) */}
                {ridersWithLocation.map((rider) => (
                  <React.Fragment key={rider._id}>
                    <Marker
                      position={[rider.location.lat, rider.location.lng]}
                      icon={createRiderIcon(rider.status)}
                      eventHandlers={{ click: () => handleRiderClick(rider) }}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <strong>{rider.name}</strong>
                          <br />
                          <small>
                            🛵 {rider.vehicle?.type || 'Vehicle'}
                            <br />
                            📋 {rider.vehicle?.plateNumber || 'N/A'}
                            <br />
                            📱 {rider.phone}
                            <br />
                            ⭐ {rider.rating} | 📦 {rider.totalDeliveries || 0} deliveries
                            <br />
                            💰 ₹{rider.earnings?.today || 0} today
                            <br />
                            📍 Last update: {rider.lastLocationUpdate
                              ? new Date(rider.lastLocationUpdate).toLocaleTimeString()
                              : 'Never'}
                          </small>
                          <div className="mt-2">{statusBadge(rider.status)}</div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Rider movement path (if available) */}
                    {riderPaths[rider._id] && riderPaths[rider._id].length > 1 && (
                      <Polyline
                        positions={riderPaths[rider._id]}
                        pathOptions={{
                          color: rider.status === 'online' ? '#4CAF50' : '#FF9800',
                          weight: 3,
                          opacity: 0.6,
                          dashArray: '8 4',
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </MapContainer>

              {/* Legend Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  background: 'white',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  fontSize: '13px',
                }}
              >
                <div className="mb-1">
                  <strong>Legend</strong>
                </div>
                <div>🟢 Online</div>
                <div>🔵 Customer</div>
                <div>🟠 Busy (Delivering)</div>
                <div>⚫ Offline</div>
                <div>🟠 Wholesaler</div>
                <div>🏪 Hub Location</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ----- Rider Detail Modal ----- */}
      <Modal show={showRiderModal} onHide={() => setShowRiderModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            🛵 {selectedRider?.name}
            {selectedRider && <span className="ms-2">{statusBadge(selectedRider.status)}</span>}
          </Modal.Title>
        </Modal.Header>
        {selectedRider && (
          <Modal.Body>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Email</Col>
              <Col xs={7}>{selectedRider.email}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Phone</Col>
              <Col xs={7}>{selectedRider.phone}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Vehicle</Col>
              <Col xs={7}>
                {selectedRider.vehicle?.type} ({selectedRider.vehicle?.plateNumber})
              </Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Rating</Col>
              <Col xs={7}>⭐ {selectedRider.rating} / 5.0</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Total Deliveries</Col>
              <Col xs={7}>{selectedRider.totalDeliveries || 0}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Today's Earnings</Col>
              <Col xs={7}>₹{selectedRider.earnings?.today || 0}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Last Active</Col>
              <Col xs={7}>{formatTime(selectedRider.lastActive)}</Col>
            </Row>
            <Row className="mb-2">
              <Col xs={5} className="text-muted">Account Status</Col>
              <Col xs={7}>
                <Badge bg={selectedRider.isActive ? 'success' : 'danger'}>
                  {selectedRider.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </Col>
            </Row>
            <Row>
              <Col xs={5} className="text-muted">Current Location</Col>
              <Col xs={7}>
                {selectedRider.location?.lat?.toFixed(4)},{' '}
                {selectedRider.location?.lng?.toFixed(4)}
              </Col>
            </Row>
          </Modal.Body>
        )}
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRiderModal(false)}>
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setShowRiderModal(false);
              if (selectedRider?.location?.lat) {
                setMapCenter([selectedRider.location.lat, selectedRider.location.lng]);
                setMapZoom(16);
              }
            }}
          >
            📍 Center on Map
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HubMap;