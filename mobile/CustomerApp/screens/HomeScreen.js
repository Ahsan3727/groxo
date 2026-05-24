import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Colors, Shadows, Fonts } from '../theme/theme';

const banners = [
  'https://via.placeholder.com/350x150/FF9800/fff?text=30%25+Off+Fruits',
  'https://via.placeholder.com/350x150/4CAF50/fff?text=Free+Delivery',
];
const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages'];

const HomeScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { customer } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      // data is { products: [...] } from our backend
      setProducts(data.products || []);
    } catch (error) {
      console.log('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const getDisplayPrice = (product) => {
    return product.adminPrice || product.price;
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search products..."
            placeholderTextColor={Colors.gray}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      {/* User Greeting */}
      <View style={styles.greetingBar}>
        <Text style={styles.greetingText}>
          Hi, {customer?.name?.split(' ')[0] || 'Customer'}! 👋
        </Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutLink}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banners */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bannerRow}>
          {banners.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.banner} />
          ))}
        </ScrollView>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={styles.chip}
              onPress={() => navigation.navigate('ProductList', { category: cat })}
            >
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products */}
        <Text style={styles.sectionTitle}>Products</Text>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
                onAddToCart={addToCart}
                displayPrice={getDisplayPrice(item)}
              />
            )}
            numColumns={2}
            scrollEnabled={false}
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: 50,
    backgroundColor: Colors.white,
    ...Shadows.medium,
    marginBottom: 2,
  },
  menuIcon: { fontSize: 24, marginRight: 8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 8,
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: Colors.black },
  searchIcon: { fontSize: 18 },
  cartIcon: { fontSize: 24, marginLeft: 8 },
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    marginBottom: 4,
  },
  greetingText: { fontSize: 14, fontWeight: '600', color: Colors.black },
  logoutLink: { fontSize: 13, color: '#f44336', fontWeight: '600' },
  bannerRow: { marginVertical: 12 },
  banner: { width: 320, height: 140, borderRadius: 12, marginRight: 10 },
  categoryRow: { marginBottom: 12, paddingHorizontal: 4 },
  chip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    ...Shadows.light,
  },
  chipText: { fontWeight: '600', color: Colors.black },
  sectionTitle: {
    fontSize: Fonts.title,
    fontWeight: 'bold',
    marginLeft: 12,
    marginTop: 8,
    marginBottom: 8,
    color: Colors.black,
  },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 16, color: Colors.gray },
});

export default HomeScreen;