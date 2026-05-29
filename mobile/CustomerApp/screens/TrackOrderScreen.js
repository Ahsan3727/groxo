import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, ScrollView } from 'react-native';
import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapViewWrapper, { MapMarker } from '../components/MapViewWrapper'; // your existing wrapper
import { Colors, Fonts, Shadows, Radius } from '../theme';

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
      const socket = io(Platform.OS === 'web' ? 'https://groxo-backend.onrender.com' : 'https://groxo-backend.onrender.com', {
        query: { userId: customer._id },
        auth: { token },
      });
      socketRef.current = socket;
      socket.on('riderLocationUpdate', data => {
        if (data.orderId === order._id) setRiderLocation({ latitude: data.lat, longitude: data.lng });
      });
      setLoading(false);
    };
    connectSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [order?._id]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary600} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📦 Live Tracking</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.orderInfo}>Order <Text style={{ fontWeight: '700' }}>#GR-2024-0891</Text> · <Text style={{ color: Colors.amber600 }}>Arriving at 11:45 AM</Text></Text>

        <View style={styles.trackMap}>
          <Text style={{ fontSize: 38 }}>🛵</Text>
          <View style={styles.trackLine} />
          <View style={[styles.trackDot, { left: '18%', backgroundColor: Colors.primary600 }]} />
          <View style={[styles.trackDot, { right: '18%', backgroundColor: Colors.amber }]} />
        </View>
        <View style={styles.trackLabels}>
          <Text>📍 Store</Text>
          <Text>🏠 Your Location</Text>
        </View>

        {/* Tracking Steps */}
        <View style={styles.trackingSteps}>
          <Step completed title="Order Confirmed" time="10:30 AM" note="Your order has been placed" />
          <Step completed title="Order Picked" time="10:45 AM" note="Items packed by James" />
          <Step active title="On the Way" time="11:00 AM" note="Your shopper is heading to you" />
          <Step title="Delivered" time="Estimated: 11:45 AM" />
        </View>

        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Text>👨‍🍳</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>James Williams</Text>
              <Text style={{ color: Colors.amber, fontSize: 12 }}>⭐ 4.8</Text>
              <Text style={{ fontSize: 11, color: Colors.gray400 }}>Your personal shopper</Text>
            </View>
            <TouchableOpacity style={styles.driverAction}><Text>📞</Text></TouchableOpacity>
            <TouchableOpacity style={styles.driverAction}><Text>💬</Text></TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, marginTop: 10, color: Colors.gray600 }}>📍 Currently at: <Text style={{ fontWeight: '600' }}>Lekki Phase 1</Text> → Trans Ekulu</Text>
          <Text style={{ fontWeight: '600', marginTop: 12, fontSize: 13 }}>💝 Tip your shopper</Text>
          <View style={styles.tipRow}>
            {['$2.00', '$5.00', '$10.00', '$15.00'].map(tip => (
              <TouchableOpacity key={tip} style={[styles.tipBtn, tip === '$10.00' && styles.tipSelected]}>
                <Text style={[styles.tipText, tip === '$10.00' && { color: '#fff' }]}>{tip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={{ fontWeight: '600', fontSize: 14, marginBottom: 8 }}>📋 Order Summary</Text>
          <Text style={{ fontSize: 12, color: Colors.gray500 }}>12 items · Subtotal $40.25</Text>
          <Text style={{ fontSize: 12, color: Colors.gray500 }}>Bag fee $0.25 · Service fee $5.25</Text>
          <View style={{ height: 1, backgroundColor: Colors.gray200, marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600' }}>Total Paid</Text>
            <Text style={{ fontWeight: '600', fontSize: 16, color: Colors.primary600 }}>$49.00</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>✅ Confirm Delivery Received</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// Simple step component
const Step = ({ completed, active, title, time, note }) => (
  <View style={styles.stepRow}>
    <View style={[styles.stepIcon, completed ? styles.stepCompleted : active ? styles.stepActive : styles.stepPending]}>
      <Text style={{ color: '#fff', fontSize: 12 }}>{completed ? '✓' : active ? '●' : ''}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ fontWeight: '600', fontSize: 13 }}>{title}</Text>
      <Text style={{ fontSize: 11, color: Colors.gray400 }}>{time}{note ? ` · ${note}` : ''}</Text>
    </View>
    {stepLine}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 8,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 20, color: Colors.primary600 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderInfo: { paddingHorizontal: 16, marginTop: 16, fontSize: 13, color: Colors.gray500 },
  trackMap: {
    height: 160,
    backgroundColor: '#ecfdf5',
    borderRadius: Radius.xl,
    marginHorizontal: 16,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
    position: 'relative',
    overflow: 'hidden',
  },
  trackLine: {
    position: 'absolute',
    width: '64%',
    height: 3,
    backgroundColor: Colors.primary400,
    borderRadius: 2,
  },
  trackDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: -8,
    marginBottom: 12,
    fontSize: 10,
    color: Colors.gray500,
  },
  trackingSteps: { marginHorizontal: 16, marginTop: 16 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCompleted: { backgroundColor: Colors.primary500 },
  stepActive: { backgroundColor: Colors.amber, shadowColor: Colors.amber, shadowOpacity: 0.4, shadowRadius: 10, elevation: 2 },
  stepPending: { backgroundColor: Colors.gray200 },
  driverCard: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.xl,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 10 },
  tipBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
  },
  tipSelected: { backgroundColor: Colors.primary500, borderColor: Colors.primary500 },
  tipText: { fontWeight: '600', fontSize: 12 },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  confirmBtn: {
    backgroundColor: Colors.primary600,
    borderRadius: Radius.full,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 3,
  },
});