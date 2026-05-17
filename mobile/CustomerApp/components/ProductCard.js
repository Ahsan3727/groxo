import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../theme/theme';
export default function ProductCard({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: product.image || 'https://via.placeholder.com/150' }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart && onAddToCart(product)}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.white, borderRadius: 12, margin: 6, ...Shadows.light },
  image: { height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  info: { padding: 10 },
  name: { fontWeight: '600', fontSize: 14, marginBottom: 4, color: Colors.black },
  price: { fontWeight: 'bold', fontSize: 16, color: Colors.primary, marginBottom: 8 },
  addBtn: { backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, alignSelf: 'flex-start' },
  addBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
});
