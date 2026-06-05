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
  Dimensions,
} from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts, Shadows, Radius } from '../theme'; // your existing theme

// Override primary color to warm orange for this screen (if needed)
const Colors = {
  ...GlobalColors,
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  primaryDark: '#E6691C',
  heroBg: '#FF9F43',
  heroText: '#FFFFFF',
};

const { width } = Dimensions.get('window');
const numColumns = width >= 600 ? 3 : 2;   // responsive columns

const banners = [
  'https://via.placeholder.com/350x150/FF9F43/FFFFFF?text=30%25+Off+Fruits',
  'https://via.placeholder.com/350x150/4CAF50/FFFFFF?text=Free+Delivery',
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
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const getDisplayPrice = (product) => product.adminPrice || product.price;

  const cardWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.gray500 }}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search groceries, fruits & more..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroTag}>
            <Text style={styles.heroTagText}>🔥 Weekly Special</Text>
          </View>
          <Text style={styles.heroTitle}>Up to 30% Off</Text>
          <Text style={styles.heroSubtitle}>on fresh organic fruits & vegetables</Text>
          <TouchableOpacity style={styles.heroBtn}>
            <Text style={styles.heroBtnText}>Shop Now →</Text>
          </TouchableOpacity>
          <Text style={styles.heroFloat}>🥑</Text>
        </View>

        {/* Offer Cards */}
        <View style={styles.offerRow}>
          <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#FFF0E5' }]}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: Colors.darkest }}>Organic</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#b45309' }}>20% OFF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#FFE8E0' }]}>
            <Text style={{ fontSize: 28 }}>🥩</Text>
            <Text style={{ fontWeight: '700', fontSize: 13, color: Colors.darkest }}>Fresh Meat</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#b91c1c' }}>15% OFF</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={styles.chip}
              onPress={() => navigation.navigate('ProductList', { category: cat })}
              activeOpacity={0.7}
            >
              <View style={styles.chipIcon}><Text>🛍️</Text></View>
              <Text style={styles.chipText}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Popular Products (horizontal scroll) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Popular</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
          {filtered.slice(0, 8).map(item => (
            <ProductCardInline
              key={item._id}
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
              onAddToCart={addToCart}
            />
          ))}
        </ScrollView>

        {/* Best Sellers (grid) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🛒 Best Sellers</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛍️</Text>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item._id}
            numColumns={numColumns}
            key={numColumns}
            scrollEnabled={false}
            columnWrapperStyle={numColumns > 1 ? styles.row : null}
            renderItem={({ item }) => (
              <Card
                style={[styles.productCard, { width: cardWidth }]}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              >
                <Text style={styles.productEmoji}>{item.emoji || '🛍️'}</Text>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>Rs. {getDisplayPrice(item)}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addToCart(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </Card>
            )}
          />
        )}

        {/* Delivery Banner */}
        <View style={styles.deliveryBanner}>
          <Text style={{ fontSize: 26 }}>🚚</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 12, color: Colors.darkest }}>
              Free delivery on orders above Rs. 500!
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '72%' }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      <BottomTabBar navigation={navigation} activeScreen="Home" />
    </View>
  );
}

// Inline horizontal product card (matches the mockup)
function ProductCardInline({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.productCardInline} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.productEmoji}>{product.emoji || '🛍️'}</Text>
      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productDesc}>{product.description || ''}</Text>
      <View style={styles.productBottom}>
        <Text style={styles.productPrice}>Rs. {(product.adminPrice || product.price).toFixed(2)}</Text>
        <TouchableOpacity style={styles.productAdd} onPress={() => onAddToCart(product)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingTop: Constants.statusBarHeight + 8,
    backgroundColor: '#FF9F43',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Shadows.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    paddingLeft: 16,
    marginRight: 8,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: Colors.gray400 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.gray900 },
  clearIcon: { fontSize: 18, color: Colors.gray500, marginRight: 12 },
  cartButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  cartIcon: { fontSize: 24 },
  hero: {
    backgroundColor: '#FF9F43',
    borderRadius: Radius.xl,
    padding: 22,
    margin: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroTagText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28, marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  heroBtnText: { color: '#FF7F2A', fontWeight: '700', fontSize: 13 },
  heroFloat: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -30,
    fontSize: 60,
    opacity: 0.8,
  },
  offerRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  offerCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 14,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: '#3E2723' },
  seeAll: { fontSize: 13, color: '#FF7F2A', fontWeight: '600' },
  categoryRow: { paddingLeft: 12, paddingRight: 8, marginBottom: 16 },
  chip: {
    alignItems: 'center',
    marginRight: 16,
    width: 70,
  },
  chipIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    ...Shadows.sm,
  },
  chipText: { fontSize: 10, color: '#3E2723', fontWeight: '500' },
  productScroll: { marginBottom: 16, paddingLeft: 16 },
  productCardInline: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 12,
    marginRight: 12,
    width: 148,
    borderWidth: 1,
    borderColor: '#FFD0B5',
    ...Shadows.sm,
  },
  productCard: {
    marginHorizontal: 4,
    marginBottom: 12,
    alignItems: 'center',
    padding: 14,
  },
  productEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  productName: { fontWeight: '600', fontSize: 13, color: '#3E2723', lineHeight: 16, textAlign: 'center' },
  productDesc: { fontSize: 10, color: '#9A3412', marginVertical: 2, textAlign: 'center' },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productPrice: { fontWeight: '700', fontSize: 15, color: '#E6691C' },
  productAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF7F2A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7F2A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#FF7F2A',
    borderRadius: Radius.full,
    paddingVertical: 8,
    paddingHorizontal: 20,
    minWidth: 70,
    alignItems: 'center',
    shadowColor: '#FF7F2A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9A3412' },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF0E5',
    borderRadius: Radius.lg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD0B5',
  },
  progressBar: { height: 5, backgroundColor: '#FFD0B5', borderRadius: 10, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#FF7F2A', borderRadius: 10 },
  row: { justifyContent: 'space-between', paddingHorizontal: 8 },
});