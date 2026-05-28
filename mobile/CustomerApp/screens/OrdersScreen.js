import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Shadows, Radius } from '../theme';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary600} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet</Text>}
        renderItem={({ item }) => (
          <Card style={styles.orderCard} onPress={() => navigation.navigate('TrackOrder', { order: item })}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={styles.itemCount}>{item.items?.length || 0} items · ${item.payment?.amount?.toFixed(2)}</Text>
            <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            {item.status === 'out_for_delivery' && (
              <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('TrackOrder', { order: item })}>
                <Text style={styles.trackBtnText}>Track Order →</Text>
              </TouchableOpacity>
            )}
          </Card>
        )}
      />
      <BottomTabBar navigation={navigation} activeScreen="Orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.gray900 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderCard: { marginBottom: 10, padding: 14 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontWeight: '600', fontSize: 15, color: Colors.gray800 },
  itemCount: { fontSize: 13, color: Colors.gray500, marginBottom: 4 },
  orderDate: { fontSize: 11, color: Colors.gray400 },
  trackBtn: {
    backgroundColor: Colors.primary100,
    borderRadius: Radius.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  trackBtnText: { color: Colors.primary600, fontWeight: '600', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});