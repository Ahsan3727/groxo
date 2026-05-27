import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Shadows, Radius } from '../theme';

const banners = [
  'https://via.placeholder.com/350x150/FF9800/fff?text=30%25+Off+Fruits',
  'https://via.placeholder.com/350x150/4CAF50/fff?text=Free+Delivery',
];
const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages'];

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { customer } = useAuth();

  useEffect(() => { fetchProducts(); }, []);
  const fetchProducts = async () => {
    try { const { data } = await api.get('/products'); setProducts(data.products || []); } catch (e) { console.log(e); } finally { setLoading(false); }
  };
  const filtered = search ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : products;
  const getDisplayPrice = (product) => product.adminPrice || product.price;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary600} /><Text>Loading products...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}><Text style={styles.menuIcon}>☰</Text></TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput placeholder="Search products..." placeholderTextColor={Colors.gray400} value={search} onChangeText={setSearch} style={styles.searchInput} />
          <TouchableOpacity onPress={() => navigation.navigate('Search')}><Text style={styles.searchIcon}>🔍</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}><Text style={styles.cartIcon}>🛒</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.greetingBar}>
          <Text style={styles.greetingText}>Hi, {customer?.name?.split(' ')[0] || 'Customer'}! 👋</Text>
        </View>
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
        <Text style={styles.sectionTitle}>Products</Text>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>No products found</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            numColumns={2}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Card style={{ flex: 1, margin: 6, alignItems: 'center' }} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                <Text style={{ fontSize: 36 }}>{item.emoji || '🛍️'}</Text>
                <Text style={{ fontWeight: '600', fontSize: 13, marginTop: 6 }}>{item.name}</Text>
                <Text style={{ fontWeight: '700', color: Colors.primary600, marginTop: 4 }}>₹{getDisplayPrice(item)}</Text>
                <TouchableOpacity style={{ marginTop: 8, backgroundColor: Colors.primary600, borderRadius: Radius.full, paddingVertical: 4, paddingHorizontal: 16 }}
                  onPress={() => addToCart(item)}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Add</Text>
                </TouchableOpacity>
              </Card>
            )}
          />
        )}
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, paddingTop: 50, backgroundColor: Colors.white, ...Shadows.md },
  menuIcon: { fontSize: 24, marginRight: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray100, borderRadius: Radius.full, paddingHorizontal: 10, marginHorizontal: 8 },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: Colors.gray900 },
  searchIcon: { fontSize: 18 },
  cartIcon: { fontSize: 24, marginLeft: 8 },
  greetingBar: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white, marginBottom: 4 },
  greetingText: { fontSize: 14, fontWeight: '600', color: Colors.gray900 },
  bannerRow: { marginVertical: 12 },
  banner: { width: 320, height: 140, borderRadius: Radius.lg, marginRight: 10 },
  categoryRow: { marginBottom: 12, paddingHorizontal: 4 },
  chip: { backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, marginRight: 10, ...Shadows.sm },
  chipText: { fontWeight: '600', color: Colors.gray900 },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', marginLeft: 12, marginTop: 8, marginBottom: 8 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.gray400 },
});
