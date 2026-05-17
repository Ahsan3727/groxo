import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../theme/theme';
export default function OrderConfirmScreen({ route, navigation }) {
  const { order } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🎉</Text>
      <Text style={styles.title}>Order Placed!</Text>
      <Text style={styles.orderId}>Order ID: {order?._id?.slice(-8) || 'N/A'}</Text>
      <Text style={styles.eta}>Estimated delivery: 30 mins</Text>
      <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('TrackOrder', { order })}><Text style={styles.trackBtnText}>Track Order</Text></TouchableOpacity>
      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('HomeTab')}><Text style={styles.homeBtnText}>Back to Shopping</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white, padding: 24 },
  emoji: { fontSize: 64 }, title: { fontSize: 28, fontWeight: 'bold', marginVertical: 12, color: Colors.primary },
  orderId: { color: Colors.gray, marginBottom: 4 }, eta: { color: Colors.gray, marginBottom: 24 },
  trackBtn: { backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, ...Shadows.medium, marginBottom: 12 },
  trackBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  homeBtn: { padding: 10 }, homeBtnText: { color: Colors.primary, fontWeight: '600' },
});
