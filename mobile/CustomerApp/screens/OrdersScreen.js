import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import Card from '../components/Card';
import OrderStatusBadge from '../components/OrderStatusBadge';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts, Shadows } from '../theme';

const Colors = {
  primary: '#FF7F2A', primaryLight: '#FFF0E5', white: '#FFFFFF', gray100: '#f1f5f9',
  gray400: '#9CA3AF', gray600: '#475569', darkest: '#3E2723', orangeText: '#8B4513',
  heroBg: '#FF9F43',
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <Card style={styles.orderCard} onPress={() => navigation.navigate('TrackOrder', { order: item })}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
        <OrderStatusBadge status={item.status} />
      </View>
      <Text style={styles.itemCount}>{item.items?.length || 0} items · Rs. {item.payment?.amount?.toFixed(2)}</Text>
      <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      {item.status === 'out_for_delivery' && (
        <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('TrackOrder', { order: item })}>
          <Text style={styles.trackBtnText}>Track Order →</Text>
        </TouchableOpacity>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 My Orders</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders yet</Text>}
      />
      <BottomTabBar navigation={navigation} activeScreen="Orders" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { paddingTop: Constants.statusBarHeight + 16, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm, marginBottom: 8 },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  orderCard: { marginBottom: 10, padding: 14 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontWeight: '600', fontSize: 15, color: Colors.darkest },
  itemCount: { fontSize: 13, color: Colors.orangeText, marginBottom: 4 },
  orderDate: { fontSize: 11, color: Colors.gray400 },
  trackBtn: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 8 },
  trackBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});