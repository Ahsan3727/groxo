import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

const STATUS_FLOW = [
  { label: 'Start Packing', from: 'confirmed', to: 'packing' },
  { label: 'Ready for Pickup', from: 'packing', to: 'ready_for_pickup' },
];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert('Updated', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      // Refresh
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    }
  };

  const renderOrder = ({ item }) => {
    const nextAction = STATUS_FLOW.find(s => s.from === item.status);
    return (
      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
        <Text style={styles.customer}>Customer: {item.customer?.name}</Text>
        <Text style={styles.status}>Status: {item.status?.replace(/_/g, ' ')}</Text>
        <Text style={styles.amount}>₹{item.payment?.amount}</Text>
        {nextAction && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => updateStatus(item._id, nextAction.to)}
          >
            <Text style={styles.actionText}>{nextAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Orders</Text>
        <View style={{ width: 50 }} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF9800" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No orders assigned</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  backBtn: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  orderId: { fontWeight: 'bold', fontSize: 16 },
  customer: { marginTop: 4 },
  status: { color: '#666', marginTop: 4 },
  amount: { fontWeight: '600', marginTop: 4 },
  actionBtn: { backgroundColor: '#FF9800', marginTop: 10, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});