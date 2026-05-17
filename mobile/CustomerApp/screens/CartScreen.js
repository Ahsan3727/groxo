import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import { Colors, Shadows } from '../theme/theme';
export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, subtotal, total, discount, applyPromo, clearCart } = useCart();
  const [code, setCode] = useState('');
  if (items.length === 0) return <View style={styles.empty}><Text style={styles.emptyText}>Your cart is empty</Text></View>;
  return (
    <View style={styles.container}>
      <FlatList data={items} keyExtractor={item => item._id} renderItem={({ item }) => <CartItem item={item} onUpdateQty={updateQuantity} onRemove={removeFromCart} />} contentContainerStyle={{ paddingBottom: 16 }} />
      <View style={styles.promo}>
        <TextInput placeholder="Promo code" value={code} onChangeText={setCode} style={styles.promoInput} placeholderTextColor={Colors.gray} />
        <TouchableOpacity style={styles.applyBtn} onPress={() => applyPromo(code)}><Text style={styles.applyText}>Apply</Text></TouchableOpacity>
      </View>
      <View style={styles.breakdown}>
        <Text style={styles.row}>Subtotal: <Text style={styles.bold}>₹{subtotal.toFixed(2)}</Text></Text>
        {discount > 0 && <Text style={styles.row}>Discount: <Text style={styles.bold}>-{discount * 100}%</Text></Text>}
        <Text style={[styles.row, styles.total]}>Total: <Text style={styles.bold}>₹{total.toFixed(2)}</Text></Text>
      </View>
      <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate('Checkout')}>
        <Text style={styles.checkoutText}>Proceed to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 12 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  emptyText: { color: Colors.gray, fontSize: 18 },
  promo: { flexDirection: 'row', marginVertical: 12 },
  promoInput: { flex: 1, backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 12, marginRight: 8, borderWidth: 1, borderColor: Colors.lightGray },
  applyBtn: { backgroundColor: Colors.accent, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  applyText: { color: Colors.white, fontWeight: 'bold' },
  breakdown: { backgroundColor: Colors.white, padding: 16, borderRadius: 12, ...Shadows.light, marginBottom: 12 },
  row: { fontSize: 14, marginBottom: 4 },
  bold: { fontWeight: 'bold', color: Colors.black },
  total: { fontSize: 18, marginTop: 8, borderTopWidth: 1, borderColor: Colors.lightGray, paddingTop: 8 },
  checkoutBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', ...Shadows.medium },
  checkoutText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
