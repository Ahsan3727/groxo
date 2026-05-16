import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useCart } from '../../shared/context/CartContext';
import { colors } from '../../shared/constants/colors';

const ProductDetail = ({ route, navigation }) => {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product, quantity);
    Alert.alert('Added to cart', `${quantity} x ${product.name} added`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imagePlaceholder}>
        <Text style={{ color: '#aaa' }}>Product Image</Text>
      </View>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Text style={styles.stock}>
        {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
      </Text>
      <View style={styles.qtyRow}>
        <TouchableOpacity
          onPress={() => setQuantity(Math.max(1, quantity - 1))}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyValue}>{quantity}</Text>
        <TouchableOpacity
          onPress={() => setQuantity(quantity + 1)}
          style={styles.qtyBtn}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        onPress={handleAddToCart}
        disabled={product.stock === 0}
      >
        <Text style={styles.addBtnText}>
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  imagePlaceholder: {
    height: 250,
    backgroundColor: '#eee',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  price: { fontSize: 22, fontWeight: '700', color: colors.secondary, marginTop: 8 },
  stock: { color: colors.textSecondary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  qtyBtn: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  qtyValue: { marginHorizontal: 20, fontSize: 20, fontWeight: '600' },
  addBtn: {
    backgroundColor: colors.secondary,
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default ProductDetail;
