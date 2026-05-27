import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewWrapper, { MapMarker } from '../components/MapViewWrapper'; // reuse existing
import { Colors, Fonts } from '../theme';

export default function TrackOrderScreen({ navigation, route }) {
  const order = route?.params?.order;
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!order?.rider?._id) { setLoading(false); return; }
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      const customerData = await AsyncStorage.getItem('customerData');
      if (!token || !customerData) return;
      const customer = JSON.parse(customerData);
      const socket = io(Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000', { query: { userId: customer._id }, auth: { token } });
      socketRef.current = socket;
      socket.on('riderLocationUpdate', data => { if (data.orderId === order._id) setRiderLocation({ latitude: data.lat, longitude: data.lng }); });
      setLoading(false);
    };
    connectSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [order?._id]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary600} /></View>;

  return (
    <View style={styles.container}>
      <MapViewWrapper style={{ flex: 1 }} region={{ latitude: riderLocation?.latitude || 31.72, longitude: riderLocation?.longitude || 72.98, latitudeDelta: 0.01, longitudeDelta: 0.01 }}>
        {riderLocation && <MapMarker coordinate={riderLocation} title="Rider" />}
      </MapViewWrapper>
      <View style={styles.header}>
        <Text style={styles.backBtn} onPress={() => navigation.goBack()}>← Back</Text>
        <Text style={styles.title}>Track Order</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={styles.orderCard}>
        <Text style={styles.orderId}>Order #{order._id.slice(-6)}</Text>
        <Text style={styles.status}>Status: {order.status?.replace(/_/g, ' ')}</Text>
        {riderLocation ? <Text style={styles.live}>📍 Rider is on the way!</Text> : <Text style={styles.waiting}>Waiting for rider location...</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 8, zIndex: 2000 },
  backBtn: { fontSize: 16, color: Colors.primary600, fontWeight: '600' },
  title: { fontSize: Fonts.sizes.lg, fontWeight: '700', flex: 1, marginLeft: 12 },
  orderCard: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: Colors.white, padding: 16, borderRadius: Radius.lg, ...Shadows.md },
  orderId: { fontWeight: '700', fontSize: 16 },
  status: { color: Colors.gray600, marginTop: 4 },
  live: { color: Colors.primary600, marginTop: 8, fontWeight: '600' },
  waiting: { color: Colors.gray400, marginTop: 8 },
});
