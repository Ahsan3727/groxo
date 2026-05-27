import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/orders').then(res => setOrders(res.data || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary600} /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('TrackOrder', { order: item })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600' }}>#{item._id.slice(-6)}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={{ color: Colors.gray600, fontSize: 13 }}>Items: {item.items?.length || 0}</Text>
            <Text style={{ color: Colors.primary600, fontWeight: '700', marginTop: 4 }}>₹{item.payment?.amount}</Text>
          </Card>
        )}
      />
      <BottomTabBar navigation={navigation} activeScreen="Orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700', padding: 16, paddingTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray400 },
});
