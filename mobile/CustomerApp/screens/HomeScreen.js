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
import { Colors, Fonts, Shadows, Radius } from '../theme';

const { width } = Dimensions.get('window');
const numColumns = width >= 600 ? 3 : 2;

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
        <ActivityIndicator size="large" color={Colors.primary600} />
        <Text style={{ marginTop: 12, color: Colors.gray500 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header – search bar only */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search for groceries, fruits & more..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            returnKeyType="search"
            editable
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroTag}><Text style={styles.heroTagText}>🔥 Weekly Special</Text></View>
          <Text style={styles.heroTitle}>Up to 30% Off</Text>
          <Text style={styles.heroSubtitle}>on fresh organic fruits & vegetables</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => {}}>
            <Text style={styles.heroBtnText}>Shop Now →</Text>
          </TouchableOpacity>
          <Text style={styles.heroFloat}>🥑</Text>
        </View>

        {/* Offer cards */}
        <View style={styles.offerRow}>
          <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#fef3c7' }]} onPress={() => {}}>
            <Text style={{ fontSize: 28 }}>🌿</Text>
            <Text style={{ fontWeight: '700', fontSize: 13 }}>Organic</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#b45309' }}>20% OFF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.offerCard, { backgroundColor: '#fee2e2' }]} onPress={() => {}}>
            <Text style={{ fontSize: 28 }}>🥩</Text>
            <Text style={{ fontWeight: '700', fontSize: 13 }}>Fresh Meat</Text>
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

        {/* Popular Fruits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Popular Fruits</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
          {products.filter(p => p.category === 'Fruits').slice(0, 8).map(item => (
            <ProductCardInline key={item._id} product={item} onPress={() => navigation.navigate('ProductDetail', { product: item })} onAddToCart={addToCart} />
          ))}
        </ScrollView>

        {/* Best Sellers */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🛒 Best Sellers</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productScroll}>
          {products.slice(0, 8).map(item => (
            <ProductCardInline key={item._id} product={item} onPress={() => navigation.navigate('ProductDetail', { product: item })} onAddToCart={addToCart} />
          ))}
        </ScrollView>

        {/* Delivery banner */}
        <View style={styles.deliveryBanner}>
          <Text style={{ fontSize: 26 }}>🚚</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', fontSize: 12 }}>You're $3.50 away from free delivery!</Text>
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

// Inline product card used in horizontal scrolls (matches mockup)
function ProductCardInline({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.productCard} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.productEmoji}>{product.emoji || '🛍️'}</Text>
      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productDesc}>{product.description || product.desc || ''}</Text>
      <View style={styles.productBottom}>
        <Text style={styles.productPrice}>${(product.adminPrice || product.price).toFixed(2)}</Text>
        <TouchableOpacity style={styles.productAdd} onPress={() => onAddToCart(product)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: Constants.statusBarHeight + 10,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: Colors.gray400 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.gray900 },
  hero: {
    backgroundColor: Colors.primary900,
    borderRadius: Radius.xl,
    padding: 22,
    margin: 16,
    marginTop: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroTagText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28, marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 3,
  },
  heroBtnText: { color: Colors.primary800, fontWeight: '700', fontSize: 13 },
  heroFloat: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -30,
    fontSize: 60,
    opacity: 0.8,
  },
  offerRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 20 },
  offerCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: 14,
    justifyContent: 'space-between',
    ...Shadows.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.gray900 },
  seeAll: { fontSize: 13, color: Colors.primary600, fontWeight: '600' },
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
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipText: { fontSize: 10, color: Colors.gray600, fontWeight: '500' },
  productScroll: { marginBottom: 16, paddingLeft: 16 },
  productCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 12,
    marginRight: 12,
    width: 148,
    borderWidth: 1,
    borderColor: Colors.gray200,
    ...Shadows.xs,
  },
  productEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  productName: { fontWeight: '600', fontSize: 13, color: Colors.gray900, lineHeight: 16 },
  productDesc: { fontSize: 10, color: Colors.gray400, marginVertical: 2 },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productPrice: { fontWeight: '700', fontSize: 15 },
  productAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary600,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff7ed',
    borderRadius: Radius.lg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  progressBar: {
    height: 5,
    backgroundColor: '#fed7aa',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 10,
  },
});