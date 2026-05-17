import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useWholesaler } from '../context/WholesalerContext';
import { Colors } from '../theme/theme';

export default function OrderDetailsScreen({ route, navigation }) {
  const { order } = route.params;
  const { confirmOrder, rejectOrder, markOrderReady, handoverComplete } = useWholesaler();

  const handleConfirm = () => { confirmOrder(order._id); navigation.goBack(); };
  const handleReject = () => { rejectOrder(order._id, 'Out of stock'); navigation.goBack(); };
  const handleMarkReady = () => { markOrderReady(order._id); navigation.goBack(); };
  const handleHandover = () => { handoverComplete(order._id); navigation.goBack(); };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Order #{order._id?.slice(-6)}</Text>
      <Text>Customer: {order.customer?.name}</Text>
      <Text>Address: {order.customer?.address}</Text>
      <Text>Status: {order.status}</Text>
      <Text style={styles.sectionTitle}>Items</Text>
      {order.items?.map((item, idx) => (
        <Text key={idx}>{item.product?.name} x {item.qty}</Text>
      ))}
      <Text>Total: ?{order.total}</Text>

      {order.status === 'new' && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.btnText}>Confirm Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
            <Text style={styles.btnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      {order.status === 'confirmed' && (
        <TouchableOpacity style={styles.readyBtn} onPress={handleMarkReady}>
          <Text style={styles.btnText}>Mark Ready for Pickup</Text>
        </TouchableOpacity>
      )}
      {order.status === 'ready' && (
        <TouchableOpacity style={styles.handoverBtn} onPress={handleHandover}>
          <Text style={styles.btnText}>Confirm Handover</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { role: 'rider' })}>
        <Text>?? Chat with Rider</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:Colors.background },
  title: { fontSize:22, fontWeight:'bold', marginBottom:12 },
  sectionTitle: { fontSize:18, fontWeight:'bold', marginTop:12, marginBottom:8 },
  actions: { flexDirection:'row', justifyContent:'space-between', marginTop:16 },
  confirmBtn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, flex:1, marginRight:8, alignItems:'center' },
  rejectBtn: { backgroundColor:Colors.error, padding:14, borderRadius:8, flex:1, alignItems:'center' },
  readyBtn: { backgroundColor:Colors.accent, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  handoverBtn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  btnText: { color:Colors.white, fontWeight:'bold' },
  chatBtn: { marginTop:16, alignItems:'center' }
});
