import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image } from 'react-native';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { Colors, Shadows, Fonts } from '../theme/theme';
const banners = ['https://via.placeholder.com/350x150/FF9800/fff?text=30%25+Off+Fruits', 'https://via.placeholder.com/350x150/4CAF50/fff?text=Free+Delivery'];
const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages'];
export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const { addToCart } = useCart();
  useEffect(() => { api.get('/products').then(res => setProducts(res.data.products || [])).catch(console.log); }, []);
  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : products;
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()}><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput placeholder="Search products..." placeholderTextColor={Colors.gray} value={search} onChangeText={setSearch} style={styles.searchInput} />
          <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}><Text style={styles.searchIcon}>🔍</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CartTab')}><Text style={styles.cartIcon}>🛒</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerRow}>
          {banners.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.banner} />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity key={cat} style={styles.chip} onPress={() => navigation.navigate('ProductList', { category: cat })}>
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.sectionTitle}>Popular Products</Text>
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { product: item })} onAddToCart={addToCart} />}
          numColumns={2} scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, ...Shadows.medium, marginBottom: 2 },
  menuIcon: { fontSize: 24, marginRight: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 10, marginHorizontal: 8 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: Colors.black },
  searchIcon: { fontSize: 18 },
  cartIcon: { fontSize: 24, marginLeft: 8 },
  bannerRow: { marginVertical: 12 },
  banner: { width: 320, height: 140, borderRadius: 12, marginRight: 10 },
  categoryRow: { marginBottom: 12, paddingHorizontal: 4 },
  chip: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10, ...Shadows.light },
  chipText: { fontWeight: '600', color: Colors.black },
  sectionTitle: { fontSize: Fonts.title, fontWeight: 'bold', marginLeft: 12, marginTop: 8, marginBottom: 8, color: Colors.black },
});
