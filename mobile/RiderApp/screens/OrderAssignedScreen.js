import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import * as Location from 'expo-location';

// ---------- Native map components (only on iOS/Android) ----------
let NativeMapView, NativeMarker;
if (Platform.OS !== 'web') {
  NativeMapView = require('react-native-maps').default;
  NativeMarker = require('react-native-maps').Marker;
}
import 'leaflet/dist/leaflet.css';

export default function OrderAssignedScreen({ navigation, route }) {
  const { activeOrder: contextOrder, updateOrderStatus } = useActiveOrder();
  const [currentOrder, setCurrentOrder] = useState(route?.params?.order || contextOrder);
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const webMapRef = useRef(null);

  // Sync with context if activeOrder changes
  useEffect(() => {
    if (contextOrder) {
      setCurrentOrder(contextOrder);
    }
  }, [contextOrder]);

  // Get rider's current location
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            pos => setRiderLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => console.log('Could not get location'),
            { enableHighAccuracy: true }
          );
        }
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setRiderLocation(loc.coords);
      }
    })();
  }, []);

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      await updateOrderStatus(currentOrder._id, newStatus, '', riderLocation);
      Alert.alert('Success', `Order updated to ${newStatus.replace(/_/g, ' ')}`);
      if (newStatus === 'delivered') {
        navigation.navigate('Dashboard');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrder) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noOrderText}>No active order</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backLink}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const mapCenter = {
    latitude: riderLocation?.latitude || 31.72,
    longitude: riderLocation?.longitude || 72.98,
  };

  return (
    <View style={styles.container}>
      {/* ---------- MAP ---------- */}
      {Platform.OS === 'web' ? (
        <WebOrderMap
          center={mapCenter}
          riderLocation={riderLocation}
          order={currentOrder}
          onMapReady={(map) => { webMapRef.current = map; }}
        />
      ) : (
        <NativeMapView
          style={styles.map}
          initialRegion={{
            ...mapCenter,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {riderLocation && (
            <NativeMarker coordinate={riderLocation} title="You">
              <View style={styles.markerBox}>
                <Text>🛵</Text>
              </View>
            </NativeMarker>
          )}
          {currentOrder.pickupLocation?.lat && (
            <NativeMarker
              coordinate={{ latitude: currentOrder.pickupLocation.lat, longitude: currentOrder.pickupLocation.lng }}
              title="Pickup"
              pinColor="green"
            />
          )}
          {currentOrder.deliveryAddress?.lat && (
            <NativeMarker
              coordinate={{ latitude: currentOrder.deliveryAddress.lat, longitude: currentOrder.deliveryAddress.lng }}
              title="Drop-off"
              pinColor="red"
            />
          )}
        </NativeMapView>
      )}

      {/* ---------- ORDER DETAIL CARD ---------- */}
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Order #{currentOrder._id?.slice(-6)}</Text>
        <Text style={styles.customer}>Customer: {currentOrder.customer?.name}</Text>
        <Text style={styles.pickup}>Pickup: {currentOrder.wholesaler?.storeName || currentOrder.wholesaler?.name}</Text>
        <Text style={styles.dropoff}>
          Drop: {currentOrder.deliveryAddress?.street}, {currentOrder.deliveryAddress?.city}
        </Text>
        <Text style={styles.amount}>Amount: ₹{currentOrder.payment?.amount}</Text>

        {/* ---------- STATUS-BASED ACTIONS ---------- */}
        <View style={styles.statusActions}>
          {/* Waiting for wholesaler to pack */}
          {(currentOrder.status === 'confirmed' || currentOrder.status === 'packing') && (
            <View style={styles.waitingContainer}>
              <Text style={styles.waitingText}>⏳ Waiting for wholesaler to pack the order...</Text>
            </View>
          )}

          {/* Ready for pickup – Start Delivery */}
          {currentOrder.status === 'ready_for_pickup' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStatusUpdate('out_for_delivery')}
              disabled={loading}
            >
              <Text style={styles.actionText}>📦 Pickup & Start Delivery</Text>
            </TouchableOpacity>
          )}

          {/* Out for delivery – Mark Delivered */}
          {currentOrder.status === 'out_for_delivery' && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleStatusUpdate('delivered')}
              disabled={loading}
            >
              <Text style={styles.actionText}>✅ Mark Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
        {loading && <ActivityIndicator style={styles.loader} color="#4CAF50" />}
      </View>

      {/* ---------- SAFE BACK BUTTON HEADER ---------- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Dashboard');
            }
          }}
          activeOpacity={0.6}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Active Delivery</Text>
        <View style={{ width: 44 }} />
      </View>
    </View>
  );
}

// ====================== WEB MAP COMPONENT ======================
function WebOrderMap({ center, riderLocation, order, onMapReady }) {
  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');
  const riderIcon = L.divIcon({ html: '<div style="font-size:30px;">🛵</div>', iconSize: [40,40], iconAnchor: [20,40] });
  const pickupIcon = L.divIcon({ html: '<div style="font-size:30px;">🏪</div>', iconSize: [40,40], iconAnchor: [20,40] });
  const dropoffIcon = L.divIcon({ html: '<div style="font-size:30px;">📍</div>', iconSize: [40,40], iconAnchor: [20,40] });

  return (
    <View style={{ flex: 1 }}>
      <MapContainer center={[center.latitude, center.longitude]} zoom={15} style={{ height: '100%', width: '100%' }} whenReady={(m) => onMapReady && onMapReady(m.target)}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {riderLocation && <Marker position={[riderLocation.latitude, riderLocation.longitude]} icon={riderIcon}><Popup>You</Popup></Marker>}
        {order.pickupLocation?.lat && <Marker position={[order.pickupLocation.lat, order.pickupLocation.lng]} icon={pickupIcon}><Popup>Pickup</Popup></Marker>}
        {order.deliveryAddress?.lat && <Marker position={[order.deliveryAddress.lat, order.deliveryAddress.lng]} icon={dropoffIcon}><Popup>Drop-off</Popup></Marker>}
      </MapContainer>
    </View>
  );
}

// ====================== STYLES ======================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  noOrderText: { fontSize: 18, color: '#666', marginBottom: 10 },
  backLink: { color: '#4CAF50', fontWeight: '600', fontSize: 16 },
  orderCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 10, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
  },
  orderId: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  customer: { fontSize: 14, color: '#333', marginBottom: 4 },
  pickup: { fontSize: 14, color: '#333', marginBottom: 4 },
  dropoff: { fontSize: 14, color: '#333', marginBottom: 4 },
  amount: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  statusActions: { marginTop: 8 },
  waitingContainer: {
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
  },
  waitingText: {
    color: '#E65100',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 15,
  },
  actionBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loader: { marginTop: 10 },
  markerBox: { alignItems: 'center', justifyContent: 'center' },
  // Header
  header: {
    position: 'absolute', top: 50, left: 16, right: 16,
    zIndex: 2000, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 14,
    paddingHorizontal: 8, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 10,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backIcon: { fontSize: 28, color: '#4CAF50', fontWeight: '300', lineHeight: 30 },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
});
