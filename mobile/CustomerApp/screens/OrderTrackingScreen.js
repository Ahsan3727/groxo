import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import api from '../services/api';

export default function OrderTrackingScreen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders').then(res => setOrders(res.data.orders || [])).catch(console.log);
  }, []);

  return (
    <View style={{ flex:1, padding:12 }}>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={{ backgroundColor:'#fff', padding:16, marginBottom:8, borderRadius:8 }}>
            <Text>Order #{item._id?.slice(-6)}</Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No orders yet</Text>}
      />
    </View>
  );
}