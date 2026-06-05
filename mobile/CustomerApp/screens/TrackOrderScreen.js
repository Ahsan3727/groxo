import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  Platform, Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

const Colors = {
  primary: '#FF7F2A', primaryLight: '#FFF0E5', white: '#FFFFFF', gray100: '#f1f5f9',
  gray200: '#e2e8f0', gray400: '#9CA3AF', gray600: '#475569', darkest: '#3E2723',
  orangeText: '#8B4513', heroBg: '#FF9F43', amber: '#f59e0b', green: '#16a34a',
};

export default function TrackOrderScreen({ navigation, route }) {
  const order = route?.params?.order;
  const [riderLocation, setRiderLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const scooterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scooterAnim, { toValue: -12, duration: 600, useNativeDriver: true }),
        Animated.timing(scooterAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(scooterAnim, { toValue: -6, duration: 600, useNativeDriver: true }),
        Animated.timing(scooterAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (!order?.rider?._id) { setLoading(false); return; }
    const connectSocket = async () => {
      const token = await AsyncStorage.getItem('customerToken');
      const customerData = await AsyncStorage.getItem('customerData');
      if (!token || !customerData) return;
      const customer = JSON.parse(customerData);
      const socket = io(Platform.OS === 'web' ? 'http://localhost:5000' : 'http://10.0.2.2:5000', {
        query: { userId: customer._id }, auth: { token },
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

  const statusSteps = [
    { key: 'pending', label: 'Order Confirmed', icon: '✅' },
    { key: 'packing', label: 'Order Picked / Packed', icon: '📦' },
    { key: 'out_for_delivery', label: 'On the Way', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '🏠' },
  ];
  const stepIndex = statusSteps.findIndex(s => s.key === (order?.status || 'pending'));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📦 Live Tracking</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.orderInfoBar}>
        <Text style={styles.orderId}>Order #{order._id?.slice(-6)}</Text>
        <Text style={styles.arrivalText}>{order?.status === 'delivered' ? 'Delivered' : 'Arriving soon'}</Text>
      </View>
      <View style={styles.mapContainer}>
        <View style={styles.trackLine} />
        <View style={[styles.trackDot, styles.dotStart]} />
        <View style={[styles.trackDot, styles.dotEnd]} />
        <Animated.View style={[styles.scooterWrap, { transform: [{ translateY: scooterAnim }] }]}>
          <Text style={styles.scooter}>🛵</Text>
        </Animated.View>
      </View>
      <View style={styles.mapLabels}>
        <Text style={styles.mapLabel}>📍 Store</Text>
        <Text style={styles.mapLabel}>🏠 You</Text>
      </View>
      <Card style={styles.stepsCard}>
        <Text style={styles.sectionTitle}>Order Progress</Text>
        {statusSteps.map((step, idx) => {
          const completed = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepIcon, completed && styles.stepCompleted, active && styles.stepActive, !completed && !active && styles.stepPending]}>
                <Text style={styles.stepIconText}>{completed ? '✓' : active ? '●' : ''}</Text>
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepLabel, (completed || active) && styles.stepLabelActive]}>{step.label}</Text>
                {active && <Text style={styles.stepTime}>In progress...</Text>}
                {completed && <Text style={styles.stepTime}>Completed</Text>}
              </View>
              {idx < statusSteps.length - 1 && <View style={[styles.stepLine, completed && styles.stepLineCompleted]} />}
            </View>
          );
        })}
      </Card>
      {order.rider && (order.status === 'out_for_delivery' || order.status === 'delivered') && (
        <Card style={styles.driverCard}>
          <View style={styles.driverRow}>
            <View style={styles.driverAvatar}><Text>👨‍🍳</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{order.rider?.name || 'Rider'}</Text>
              <Text style={styles.driverRating}>⭐ {order.rider?.rating || '4.8'}</Text>
              <Text style={styles.driverNote}>Your delivery partner</Text>
            </View>
            <TouchableOpacity style={styles.driverAction}><Text>📞</Text></TouchableOpacity>
            <TouchableOpacity style={styles.driverAction}><Text>💬</Text></TouchableOpacity>
          </View>
        </Card>
      )}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>📋 Order Summary</Text>
        <Text style={styles.summaryText}>{order.items?.length || 0} items · Subtotal Rs. {order.payment?.amount?.toFixed(2)}</Text>
        <View style={styles.divider} />
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Total Paid</Text><Text style={styles.totalValue}>Rs. {order.payment?.amount?.toFixed(2)}</Text></View>
      </Card>
      {order.status === 'out_for_delivery' && (
        <AppButton title="✅ Confirm Delivery Received" style={styles.confirmButton}
          onPress={() => Alert.alert('Confirm', 'Have you received your order?', [
            { text: 'No', style: 'cancel' },
            { text: 'Yes', onPress: () => navigation.goBack() },
          ])} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Constants.statusBarHeight + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  placeholder: { width: 44 },
  orderInfoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16, marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: '700', color: Colors.darkest },
  arrivalText: { fontSize: 14, color: Colors.amber, fontWeight: '600' },
  mapContainer: { height: 160, backgroundColor: Colors.primaryLight, borderRadius: Radius.xl, marginHorizontal: 20, marginTop: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFD0B5', borderStyle: 'dashed', position: 'relative', overflow: 'hidden' },
  trackLine: { position: 'absolute', width: '64%', height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  trackDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dotStart: { left: '18%', backgroundColor: Colors.primary },
  dotEnd: { right: '18%', backgroundColor: Colors.amber },
  scooterWrap: { position: 'absolute' },
  scooter: { fontSize: 38 },
  mapLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 28, marginTop: -8, marginBottom: 16 },
  mapLabel: { fontSize: 11, color: Colors.orangeText },
  stepsCard: { marginHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: Fonts.sizes.md, fontWeight: '700', color: Colors.darkest, marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, position: 'relative' },
  stepIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  stepCompleted: { backgroundColor: Colors.green },
  stepActive: { backgroundColor: Colors.amber },
  stepPending: { backgroundColor: Colors.gray200 },
  stepIconText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  stepInfo: { flex: 1, marginLeft: 12 },
  stepLabel: { fontSize: 14, fontWeight: '600', color: Colors.gray600 },
  stepLabelActive: { color: Colors.darkest },
  stepTime: { fontSize: 12, color: Colors.gray400, marginTop: 2 },
  stepLine: { position: 'absolute', left: 15, top: 32, bottom: -16, width: 2, backgroundColor: Colors.gray200 },
  stepLineCompleted: { backgroundColor: Colors.green },
  driverCard: { marginHorizontal: 20, marginBottom: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fbbf24', justifyContent: 'center', alignItems: 'center' },
  driverName: { fontWeight: '600', color: Colors.darkest },
  driverRating: { fontSize: 12, color: Colors.amber },
  driverNote: { fontSize: 11, color: Colors.gray400 },
  driverAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.gray100, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { marginHorizontal: 20, marginBottom: 16 },
  summaryText: { fontSize: 12, color: Colors.orangeText, marginBottom: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: '600', color: Colors.darkest },
  totalValue: { fontWeight: '700', fontSize: 16, color: Colors.primary },
  confirmButton: { marginHorizontal: 20, marginBottom: 12 },
});