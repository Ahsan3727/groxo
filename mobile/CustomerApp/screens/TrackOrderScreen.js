import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewWrapper, { MapMarker } from '../components/MapViewWrapper'; // reuse your cross‑platform map component

export default function TrackOrderScreen({ navigation, route }) {
  const order = route?.params?.order;
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!order || !order.rider?._id) {
      setLoading(false);
      return;
    }

    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      const customerData = await AsyncStorage.getItem('customerData');
      if (!token || !customerData) return;
      const customer = JSON.parse(customerData);

      const socket = io(Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000', {
        query: { userId: customer._id },
        auth: { token },
      });
      socketRef.current = socket;

      socket.on('connect', () => console.log('Track socket connected'));

      socket.on('riderLocationUpdate', (data) => {
        if (data.orderId === order._id) {
          setRiderLocation({ latitude: data.lat, longitude: data.lng });
        }
      });

      setLoading(false);
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [order?._id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <MapViewWrapper
        style={styles.map}
        region={{
          latitude: riderLocation?.latitude || 31.72,
          longitude: riderLocation?.longitude || 72.98,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        mapRef={null}
      >
        {riderLocation && (
          <MapMarker
            coordinate={riderLocation}
            title="Rider"
            description="Your delivery partner"
          >
            <View style={styles.markerBox}>
              <Text>🛵</Text>
            </View>
          </MapMarker>
        )}
      </MapViewWrapper>

      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Order info */}
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Order #{order._id?.slice(-6)}</Text>
        <Text style={styles.status}>Status: {order.status?.replace(/_/g, ' ')}</Text>
        {riderLocation ? (
          <Text style={styles.live}>📍 Rider is on the way!</Text>
        ) : (
          <Text style={styles.waiting}>Waiting for rider location...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  header: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 14,
    paddingHorizontal: 8, paddingVertical: 8, zIndex: 2000,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#f5f5f5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  backIcon: { fontSize: 28, color: '#2196F3', fontWeight: '300' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  orderCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'white', padding: 20,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    elevation: 10,
  },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  status: { color: '#666', marginTop: 4 },
  live: { color: '#4CAF50', marginTop: 8, fontWeight: '600' },
  waiting: { color: '#999', marginTop: 8 },
  markerBox: { alignItems: 'center', justifyContent: 'center' },
});

