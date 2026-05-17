import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useWholesaler } from '../context/WholesalerContext';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';

const Tab = createMaterialTopTabNavigator();

const OrderList = ({ orders, onPress }) => (
  <FlatList
    data={orders}
    keyExtractor={item => item._id}
    renderItem={({ item }) => (
      <TouchableOpacity style={styles.orderCard} onPress={() => onPress(item)}>
        <Text style={styles.orderId}>Order #{item._id?.slice(-6)}</Text>
        <Text>Status: {item.status}</Text>
        <Text>Items: {item.items?.length || 0}</Text>
        <Text>Total: ?{item.total}</Text>
      </TouchableOpacity>
    )}
    ListEmptyComponent={<Text style={styles.empty}>No orders</Text>}
  />
);

const NewOrders = ({ navigation }) => {
  const { orders } = useWholesaler();
  const newOrders = orders.filter(o => o.status === 'new');
  return <OrderList orders={newOrders} onPress={(order) => navigation.navigate('OrderDetails', { order })} />;
};

const ActiveOrders = ({ navigation }) => {
  const { orders } = useWholesaler();
  const active = orders.filter(o => ['confirmed', 'ready'].includes(o.status));
  return <OrderList orders={active} onPress={(order) => navigation.navigate('OrderDetails', { order })} />;
};

const CompletedOrders = ({ navigation }) => {
  const { orders } = useWholesaler();
  const done = orders.filter(o => o.status === 'completed');
  return <OrderList orders={done} onPress={(order) => navigation.navigate('OrderDetails', { order })} />;
};

const CancelledOrders = ({ navigation }) => {
  const { orders } = useWholesaler();
  const cancelled = orders.filter(o => o.status === 'rejected');
  return <OrderList orders={cancelled} onPress={(order) => navigation.navigate('OrderDetails', { order })} />;
};

export default function OrdersScreen({ navigation }) {
  return (
    <Tab.Navigator>
      <Tab.Screen name="New" children={() => <NewOrders navigation={navigation} />} />
      <Tab.Screen name="Active" children={() => <ActiveOrders navigation={navigation} />} />
      <Tab.Screen name="Completed" children={() => <CompletedOrders navigation={navigation} />} />
      <Tab.Screen name="Cancelled" children={() => <CancelledOrders navigation={navigation} />} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  orderCard: { backgroundColor:Colors.white, padding:14, marginHorizontal:12, marginVertical:6, borderRadius:8, elevation:1 },
  orderId: { fontWeight:'bold' },
  empty: { textAlign:'center', marginTop:40, color:Colors.gray }
});
