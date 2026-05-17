import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import api from '../services/api';
import { Colors, Shadows } from '../theme/theme';
export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, total, discount, clearCart } = useCart();
  const { placeOrder } = useOrders();
  const [address, setAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [slot, setSlot] = useState('Today 6-8 PM');
  useEffect(() => { api.get('/users/addresses').then(res => { if (res.data.addresses?.length) setAddress(res.data.addresses[0]); }).catch(() => {}); }, []);
  const handlePlaceOrder = async () => {
    try {
      const order = await placeOrder({ products: items.map(i => ({ product: i._id, qty: i.qty })), addressId: address?._id, paymentMethod, deliverySlot: slot, total });
      clearCart(); navigation.navigate('OrderConfirm', { order });
    } catch(e) { alert('Order failed. Please try again.'); }
  };
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.section}>Delivery Address</Text>
      {address ? (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddressList')}>
          <Text style={styles.addressLabel}>{address.label}</Text><Text>{address.line1}, {address.city}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('AddAddress')}><Text style={styles.addNew}>+ Add new address</Text></TouchableOpacity>
      )}
      <Text style={styles.section}>Delivery Slot</Text>
      <TouchableOpacity style={[styles.card, slot === 'Today 6-8 PM' && styles.selected]}><Text>{slot}</Text></TouchableOpacity>
      <Text style={styles.section}>Payment Method</Text>
      {['COD', 'Wallet'].map(m => (
        <TouchableOpacity key={m} style={[styles.card, paymentMethod === m && styles.selected]} onPress={() => setPaymentMethod(m)}>
          <Text>{m === 'COD' ? 'Cash on Delivery' : 'Wallet'}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.section}>Order Summary</Text>
      <View style={styles.summary}>
        <Text>Items: ₹{subtotal.toFixed(2)}</Text>
        {discount > 0 && <Text>Discount: {discount * 100}%</Text>}
        <Text style={styles.total}>Total: ₹{total.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.placeBtn} onPress={handlePlaceOrder}><Text style={styles.placeBtnText}>Place Order</Text></TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 12 },
  section: { fontSize: 18, fontWeight: 'bold', marginVertical: 12, color: Colors.black },
  card: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, marginBottom: 8, ...Shadows.light },
  selected: { borderColor: Colors.primary, borderWidth: 2 },
  addressLabel: { fontWeight: '600' },
  addNew: { color: Colors.primary, fontWeight: 'bold' },
  summary: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, ...Shadows.light },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 8, borderTopWidth: 1, borderColor: Colors.lightGray, paddingTop: 8 },
  placeBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginVertical: 20, ...Shadows.medium },
  placeBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
