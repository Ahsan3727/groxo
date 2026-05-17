import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

export default function OrderHistoryScreen() {
  const orders = [
    { _id: '1', status: 'delivered', earnings: 150 },
    { _id: '2', status: 'cancelled', earnings: 0 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery History</Text>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Order #{item._id?.slice(-6)}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Earnings: ₹{item.earnings}</Text>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:22, fontWeight:'bold', marginBottom:12 },
  card: { backgroundColor:Colors.white, padding:14, borderRadius:8, marginBottom:8 }
});
