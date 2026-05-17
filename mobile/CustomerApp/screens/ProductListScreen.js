import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { Colors } from '../theme/theme';
export default function ProductListScreen({ route, navigation }) {
  const [products, setProducts] = useState([]);
  const category = route.params?.category;
  const { addToCart } = useCart();
  useEffect(() => {
    const url = category ? '/products?category=' + category : '/products';
    api.get(url).then(res => setProducts(res.data.products || [])).catch(console.log);
  }, [category]);
  return (
    <View style={styles.container}>
      <FlatList
        data={products} keyExtractor={item => item._id}
        renderItem={({ item }) => <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { product: item })} onAddToCart={addToCart} />}
        numColumns={2}
        ListEmptyComponent={<Text style={styles.empty}>No products in this category</Text>}
      />
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: Colors.background, padding: 4 }, empty: { textAlign: 'center', marginTop: 40, color: Colors.gray } });
