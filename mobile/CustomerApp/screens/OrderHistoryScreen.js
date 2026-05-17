import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';
export default function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/orders').then(res => setOrders(res.data.orders || [])).catch(console.log); }, []);
  const getStatusColor = (status) => { switch(status) { case 'delivered': return Colors.primary; case 'cancelled': return Colors.error; default: return Colors.accent; } };
  return (
    <View style={styles.container}>
      <FlatList
        data={orders} keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
            <View style={styles.header}>
              <Text style={styles.orderId}>Order #{item._id?.slice(-6)}</Text>
              <Text style={[styles.status, { color: getStatusColor(item.status) }]}>{item.status?.toUpperCase()}</Text>
            </View>
            <Text style={styles.total}>₹{item.total}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 12 },
  card: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontWeight: '600' }, status: { fontWeight: 'bold' }, total: { color: Colors.gray },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray },
});
