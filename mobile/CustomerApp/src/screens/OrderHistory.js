import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import OrderCard from '../../shared/components/OrderCard';
import API from '../../shared/services/api';
import { colors } from '../../shared/constants/colors';

const OrderHistory = ({ navigation }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    API.get('/orders').then(res => setOrders(res.data)).catch(console.log);
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => navigation.navigate('Tracking', { orderId: item._id })} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 }
});

export default OrderHistory;
