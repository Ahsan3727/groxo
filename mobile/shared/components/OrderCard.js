import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const OrderCard = ({ order, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(order)}>
    <View style={styles.row}>
      <Text style={styles.id}>Order #{order._id.slice(-6)}</Text>
      <Text style={[styles.status, statusColor(order.status)]}>{order.status}</Text>
    </View>
    <Text style={styles.total}>${order.payment?.amount?.toFixed(2)}</Text>
    <Text style={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</Text>
  </TouchableOpacity>
);

const statusColor = (status) => {
  const map = { pending: '#FFA500', confirmed: '#1E90FF', out_for_delivery: '#32CD32', delivered: '#008000', cancelled: '#FF0000' };
  return { color: map[status] || '#888' };
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  id: { fontWeight: 'bold', fontSize: 16 },
  status: { fontWeight: '600', textTransform: 'capitalize' },
  total: { fontSize: 18, fontWeight: 'bold', color: '#008000' },
  date: { color: '#888', marginTop: 4 }
});

export default OrderCard;
