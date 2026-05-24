import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';   // ✅ correct import

export default function WaitingScreen({ navigation }) {
  const { availableOrders, fetchAvailableOrders, acceptOrder, rejectOrder } = useActiveOrder();  // ✅ correct hook
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAvailableOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAvailableOrders();
    setRefreshing(false);
  };

  const handleAccept = async (orderId) => {
    try {
      const order = await acceptOrder(orderId);
      Alert.alert('Accepted', 'Order accepted!', [
        { text: 'OK', onPress: () => navigation.navigate('OrderAssigned', { order }) }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not accept order');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
  onPress={() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Dashboard');
    }
  }}
>
  <Text style={styles.backBtn}>← Back</Text>
</TouchableOpacity>
        <Text style={styles.title}>Available Orders</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={availableOrders}
        keyExtractor={item => item._id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>No orders available</Text>}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <Text style={styles.orderId}>Order #{item._id?.slice(-6)}</Text>
            <Text>Customer: {item.customer?.name}</Text>
            <Text>Amount: ₹{item.payment?.amount}</Text>
            <Text>From: {item.wholesaler?.storeName || item.wholesaler?.name}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectOrder(item._id)}>
                <Text style={styles.btnText}>Reject</Text>
              </TouchableOpacity>
              
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#fff' },
  backBtn: { fontSize: 16, color: '#4CAF50' },
  title: { fontSize: 18, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  orderCard: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 10, elevation: 2 },
  orderId: { fontWeight: 'bold', marginBottom: 5 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  acceptBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6, marginRight: 10 },
  rejectBtn: { backgroundColor: '#f44336', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
});