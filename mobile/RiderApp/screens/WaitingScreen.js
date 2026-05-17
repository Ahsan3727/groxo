import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LiveMap from '../components/LiveMap';
import { useActiveOrder } from '../context/ActiveOrderContext';
import { Colors } from '../theme/theme';

export default function WaitingScreen({ navigation }) {
  const { pendingOrder, acceptOrder, declineOrder } = useActiveOrder();

  const handleAccept = () => {
    if (pendingOrder) {
      acceptOrder(pendingOrder);
      navigation.navigate('OrderAssigned');
    }
  };

  const handleDecline = () => {
    if (pendingOrder) {
      declineOrder(pendingOrder);
    }
  };

  return (
    <View style={styles.container}>
      <LiveMap region={{ latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 }} />
      {pendingOrder && (
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>New Order!</Text>
          <Text>Pickup: {pendingOrder.pickupAddress}</Text>
          <Text>Delivery: {pendingOrder.deliveryAddress}</Text>
          <Text>Earnings: ₹{pendingOrder.estimatedEarnings}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.btnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.btnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!pendingOrder && (
        <View style={styles.waitingMessage}>
          <Text>Waiting for orders...</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1 },
  alert: { position:'absolute', bottom:20, left:20, right:20, backgroundColor:Colors.white, padding:20, borderRadius:12, elevation:5 },
  alertTitle: { fontSize:20, fontWeight:'bold', marginBottom:8 },
  actions: { flexDirection:'row', justifyContent:'space-between', marginTop:12 },
  acceptBtn: { backgroundColor:Colors.primary, padding:12, borderRadius:8, flex:1, marginRight:8, alignItems:'center' },
  declineBtn: { backgroundColor:Colors.error, padding:12, borderRadius:8, flex:1, alignItems:'center' },
  btnText: { color:Colors.white, fontWeight:'bold' },
  waitingMessage: { position:'absolute', bottom:40, left:0, right:0, alignItems:'center' },
});
