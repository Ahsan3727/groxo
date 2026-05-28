import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

const statusFlow = [
  { from: 'confirmed', to: 'packing', label: 'Start Packing' },
  { from: 'packing', to: 'ready_for_pickup', label: 'Ready for Pickup' },
];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data || [])).catch(console.log);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      Alert.alert('Updated', `Order marked as ${newStatus.replace(/_/g, ' ')}`);
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Update failed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders assigned yet</Text>}
        renderItem={({ item }) => {
          const nextAction = statusFlow.find(s => s.from === item.status);
          return (
            <Card style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
                <OrderStatusBadge status={item.status} />
              </View>
              <Text style={styles.customer}>Customer: {item.customer?.name}</Text>
              <Text style={styles.amount}>Amount: ₹{item.payment?.amount}</Text>
              {nextAction && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item._id, nextAction.to)}>
                  <Text style={styles.actionText}>{nextAction.label}</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        }}
      />
      <BottomTabBar navigation={navigation} activeScreen="Orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  orderCard: { marginBottom: 10 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontWeight: '600', fontSize: 15 },
  customer: { fontSize: 13, color: Colors.gray600, marginBottom: 2 },
  amount: { fontSize: 13, color: Colors.gray600, marginBottom: 8 },
  actionBtn: { backgroundColor: Colors.primary600, borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 8 },
  actionText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});