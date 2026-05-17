import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../theme/theme';
export default function CartItem({ item, onUpdateQty, onRemove }) {
  return (
    <View style={styles.container}>
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{item.price} x {item.qty}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onUpdateQty(item._id, item.qty - 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
        <Text style={styles.qty}>{item.qty}</Text>
        <TouchableOpacity onPress={() => onUpdateQty(item._id, item.qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(item._id)} style={styles.removeBtn}><Text style={styles.removeText}>🗑</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, padding: 14, marginBottom: 8, borderRadius: 12, elevation: 1 },
  details: { flex: 1 },
  name: { fontWeight: '600', fontSize: 15, color: Colors.black },
  price: { color: Colors.gray, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 18, color: Colors.black },
  qty: { fontSize: 16, fontWeight: 'bold' },
  removeBtn: { marginLeft: 8 },
  removeText: { fontSize: 20 },
});
