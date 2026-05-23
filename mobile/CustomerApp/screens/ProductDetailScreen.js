import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useCart } from '../context/CartContext';

const ProductDetailScreen = ({ navigation, route }) => {
  const product = route?.params?.product;
  const { addToCart } = useCart();

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Product Details</Text>
        <View style={{ width: 50 }} />
      </View>
      <View style={styles.content}>
        <Image source={{ uri: product.image || 'https://via.placeholder.com/200' }} style={styles.image} />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        <Text style={styles.description}>{product.description || 'No description'}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => addToCart(product)}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff',
  },
  backButton: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { padding: 20, alignItems: 'center' },
  image: { width: 200, height: 200, borderRadius: 12, marginBottom: 20 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  price: { fontSize: 20, color: '#2196F3', fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  addButton: { backgroundColor: '#2196F3', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default ProductDetailScreen;