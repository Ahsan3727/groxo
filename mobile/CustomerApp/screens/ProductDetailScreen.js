import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../context/CartContext';
import { Colors, Shadows } from '../theme/theme';
export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [qty, setQty] = useState(1);
  const { addToCart } = useCart();
  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/300' }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        <Text style={styles.desc}>{product.description || 'Fresh and organic'}</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}><Text style={styles.qtyText}>-</Text></TouchableOpacity>
          <Text style={styles.qty}>{qty}</Text>
          <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { addToCart(product, qty); navigation.navigate('CartTab'); }}>
          <Text style={styles.addBtnText}>Add to Cart – ₹{product.price * qty}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  image: { width: '100%', height: 280 },
  content: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', color: Colors.black, marginBottom: 4 },
  price: { fontSize: 22, color: Colors.primary, marginBottom: 8, fontWeight: 'bold' },
  desc: { color: Colors.gray, marginBottom: 16, lineHeight: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 22, color: Colors.black },
  qty: { fontSize: 20, fontWeight: 'bold' },
  addBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', ...Shadows.light },
  addBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
