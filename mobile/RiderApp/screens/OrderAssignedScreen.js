import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function OrderAssignedScreen({ navigation }) {
  const { activeOrder, updateOrderStatus } = useActiveOrder();

  const handleArrivedWholesaler = () => {
    updateOrderStatus('arrived_at_wholesaler');
    navigation.navigate('ArriveWholesaler');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Assigned</Text>
      <View style={styles.card}>
        <Text>Pickup at: {activeOrder?.pickupAddress}</Text>
        <Text>Items: {activeOrder?.items?.length || 0}</Text>
        <TouchableOpacity style={styles.btn} onPress={handleArrivedWholesaler}>
          <Text style={styles.btnText}>Navigate to Wholesaler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chat', { role: 'wholesaler' })}>
          <Text>💬 Chat with Wholesaler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:Colors.background },
  title: { fontSize:24, fontWeight:'bold', marginBottom:16 },
  card: { backgroundColor:Colors.white, padding:20, borderRadius:12, width:'100%', elevation:3 },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginTop:12 },
  btnText: { color:Colors.white, fontWeight:'bold' },
  chatBtn: { marginTop:12, alignItems:'center' }
});
