import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function OrderDetailScreen({ route }) {
  const { order } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order #{order._id}</Text>
      <Text>Status: {order.status}</Text>
      <Text style={styles.section}>Items:</Text>
      {order.products?.map((p, i) => <Text key={i}>- {p.product?.name || p.product} x {p.qty}</Text>)}
      <Text>Total: ₹{order.total}</Text>
      <Text>Payment: {order.paymentMethod}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, padding: 16, backgroundColor: Colors.white }, title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 }, section: { fontWeight: 'bold', marginTop: 12 } });
