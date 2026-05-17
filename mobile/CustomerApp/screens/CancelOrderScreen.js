import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useOrders } from '../context/OrderContext';
import { Colors } from '../theme/theme';
export default function CancelOrderScreen({ route, navigation }) {
  const { order } = route.params;
  const [reason, setReason] = useState('');
  const { cancelOrder } = useOrders();
  const reasons = ['Change of mind', 'Wrong address', 'Duplicate order', 'Delivery too late', 'Other'];
  const handleCancel = async () => { if (!reason) return; await cancelOrder(order._id, reason); navigation.popToTop(); };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Why are you cancelling?</Text>
      {reasons.map(r => (
        <TouchableOpacity key={r} style={[styles.reason, reason === r && styles.selected]} onPress={() => setReason(r)}>
          <Text>{r}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.btn, !reason && { opacity: 0.5 }]} onPress={handleCancel} disabled={!reason}>
        <Text style={styles.btnText}>Confirm Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  reason: { backgroundColor: Colors.white, padding: 14, borderRadius: 10, marginBottom: 8 },
  selected: { borderColor: Colors.error, borderWidth: 2 },
  btn: { backgroundColor: Colors.error, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  btnText: { color: Colors.white, fontWeight: 'bold' },
});
