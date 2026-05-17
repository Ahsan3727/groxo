import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { Colors, Shadows } from '../theme/theme';
export default function TrackOrderScreen({ route, navigation }) {
  const { order: initial } = route.params;
  const [order, setOrder] = useState(initial);
  useEffect(() => {
    const interval = setInterval(async () => { const res = await api.get('/orders/' + initial._id); setOrder(res.data.order); }, 10000);
    return () => clearInterval(interval);
  }, []);
  const statuses = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered'];
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Order #{order._id?.slice(-6)}</Text>
      <View style={styles.timeline}>
        {statuses.map((s, i) => (
          <View key={s} style={[styles.step, order.status === s && styles.active]}>
            <Text style={[styles.stepText, order.status === s && styles.activeText]}>{s.replace('_', ' ').toUpperCase()}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.eta}>ETA: 15 mins</Text>
      <View style={styles.mapPlaceholder}><Text>🗺️ Live Map Placeholder</Text></View>
      <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat')}><Text style={styles.chatBtnText}>💬 Chat with Rider</Text></TouchableOpacity>
      {order.status !== 'delivered' && order.status !== 'cancelled' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.navigate('CancelOrder', { order })}><Text style={styles.cancelText}>Cancel Order</Text></TouchableOpacity>
      )}
      {order.status === 'delivered' && (
        <TouchableOpacity style={styles.rateBtn} onPress={() => navigation.navigate('Rate', { order })}><Text style={styles.rateText}>⭐ Rate Delivery</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: Colors.black },
  timeline: { marginBottom: 16 },
  step: { paddingVertical: 8, paddingLeft: 12, borderLeftWidth: 3, borderLeftColor: Colors.lightGray },
  active: { borderLeftColor: Colors.primary },
  stepText: { color: Colors.gray },
  activeText: { color: Colors.black, fontWeight: 'bold' },
  eta: { fontWeight: '600', marginBottom: 12 },
  mapPlaceholder: { height: 180, backgroundColor: '#e0e0e0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  chatBtn: { backgroundColor: Colors.white, padding: 14, borderRadius: 12, alignItems: 'center', ...Shadows.light, marginBottom: 8 },
  chatBtnText: { color: Colors.black, fontWeight: '600' },
  cancelBtn: { backgroundColor: Colors.error, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  cancelText: { color: Colors.white, fontWeight: 'bold' },
  rateBtn: { backgroundColor: Colors.warning, padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  rateText: { fontWeight: 'bold' },
});
