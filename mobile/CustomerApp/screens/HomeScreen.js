import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import Constants from 'expo-constants';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import ImageCarousel from '../components/ImageCarousel';
import CartSummaryBar from '../components/CartSummaryBar';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts, Shadows, Radius } from '../theme';

// Warm orange palette
const Colors = {
  primary: '#FF7F2A',
  primaryLight: '#FFF0E5',
  primaryDark: '#E6691C',
  white: '#FFFFFF',
  gray400: '#9CA3AF',
  darkest: '#3E2723',
  orangeText: '#8B4513',
  heroBg: '#FF9F43',
  border: '#FFD0B5',
  green: '#16a34a',
};

const { width } = Dimensions.get('window');
const numColumns = width >= 600 ? 3 : 2;   // responsive columns

const categories = ['Fruits', 'Vegetables', 'Dairy', 'Bakery', 'Beverages'];

export default function HomeScreen({ navigation }) {
  // ---------- State ----------
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { addToCart } = useCart();
  const { cart } = useCart();

  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;   // fade‑in for main content
  const progressAnim = useRef(new Animated.Value(0)).current; // delivery progress bar

  // ---------- Cart calculations ----------
  const cartTotal = cart.reduce((sum, item) => sum + (item.adminPrice || item.price) * item.quantity, 0);
  const freeDeliveryThreshold = 1000;
  const progress = Math.min(cartTotal / freeDeliveryThreshold, 1);
  const remaining = freeDeliveryThreshold - cartTotal;

  // ---------- Data fetching ----------
  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/banners');
      setBanners(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchPopularProducts = async () => {
    try {
      const { data } = await api.get('/products/popular');
      setPopularProducts(data.products || []);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchBanners(), fetchPopularProducts()])
      .finally(() => {
        setLoading(false);
        // Start fade‑in animation after loading
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
  }, []);

  // ---------- Pull‑to‑refresh ----------
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchBanners(), fetchPopularProducts()]);
    setRefreshing(false);
  }, []);

  // Animate delivery progress bar when cartTotal changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [cartTotal]);

  // ---------- Derived data ----------
  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const getDisplayPrice = (product) => product.adminPrice || product.price;
  const cardWidth = (width - 32 - (numColumns - 1) * 12) / numColumns;

  // ---------- Loading state ----------
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 12, color: Colors.gray400 }}>Loading products...</Text>
      </View>
    );
  }

  // ---------- Main UI ----------
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

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 220 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Image Carousel (banners from admin) */}
          <ImageCarousel
            banners={banners}
            onBannerPress={(banner) => {
              if (banner.link) navigation.navigate(banner.link);
            }}
          />

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
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

          {/* Popular Products (dynamic) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Popular</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See all →</Text></TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productScroll}
          >
            {popularProducts.map(item => (
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

          {/* Dynamic Delivery Banner with animated progress bar */}
          <View style={styles.deliveryBanner}>
            <Text style={{ fontSize: 26 }}>🚚</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', fontSize: 12, color: Colors.darkest }}>
                {progress >= 1
                  ? '🎉 Free Delivery Unlocked!'
                  : `Add Rs. ${remaining.toFixed(0)} more for free delivery`
                }
              </Text>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: progress >= 1 ? Colors.green : Colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Floating cart summary bar (appears when cart has items) */}
      <CartSummaryBar navigation={navigation} />

      {/* Bottom Tab Bar */}
      <BottomTabBar navigation={navigation} activeScreen="Home" />
    </View>
  );
}

// Inline horizontal product card
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

// Styles – unchanged from the previous complete version
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    paddingTop: Constants.statusBarHeight + 8, backgroundColor: '#FF9F43',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: Radius.full, paddingLeft: 16, marginRight: 8, height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: 8, color: Colors.gray400 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.darkest },
  clearIcon: { fontSize: 18, color: Colors.gray400, marginRight: 12 },
  cartButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  cartIcon: { fontSize: 24 },
  hero: {
    backgroundColor: '#FF9F43', borderRadius: Radius.xl, padding: 22, margin: 16,
    position: 'relative', overflow: 'hidden', ...Shadows.lg,
  },
  heroTag: {
    backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: 8,
  },
  heroTagText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', letterSpacing: -0.6, lineHeight: 28, marginBottom: 4 },
  heroSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: Radius.full, alignSelf: 'flex-start',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 14, elevation: 3,
  },
  heroBtnText: { color: '#FF7F2A', fontWeight: '700', fontSize: 13 },
  heroFloat: { position: 'absolute', right: 12, top: '50%', marginTop: -30, fontSize: 60, opacity: 0.8 },
  offerRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 },
  offerCard: { flex: 1, borderRadius: Radius.lg, padding: 14, justifyContent: 'space-between', ...Shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: '#3E2723' },
  seeAll: { fontSize: 13, color: '#FF7F2A', fontWeight: '600' },
  categoryRow: { paddingLeft: 12, paddingRight: 8, marginBottom: 16 },
  chip: { alignItems: 'center', marginRight: 16, width: 70 },
  chipIcon: {
    width: 50, height: 50, borderRadius: Radius.md, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 6, ...Shadows.sm,
  },
  chipText: { fontSize: 10, color: '#3E2723', fontWeight: '500' },
  productScroll: { marginBottom: 16, paddingLeft: 16 },
  productCardInline: {
    backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 12, marginRight: 12,
    width: 148, borderWidth: 1, borderColor: '#FFD0B5', ...Shadows.sm,
  },
  productCard: { marginHorizontal: 4, marginBottom: 12, alignItems: 'center', padding: 14 },
  productEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  productName: { fontWeight: '600', fontSize: 13, color: '#3E2723', lineHeight: 16, textAlign: 'center' },
  productDesc: { fontSize: 10, color: '#9A3412', marginVertical: 2, textAlign: 'center' },
  productBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  productPrice: { fontWeight: '700', fontSize: 15, color: '#E6691C' },
  productAdd: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#FF7F2A',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#FF7F2A', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  addButton: {
    marginTop: 10, backgroundColor: '#FF7F2A', borderRadius: Radius.full,
    paddingVertical: 8, paddingHorizontal: 20, minWidth: 70, alignItems: 'center',
    shadowColor: '#FF7F2A', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9A3412' },
  deliveryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF0E5', borderRadius: Radius.lg, padding: 12,
    marginHorizontal: 16, marginTop: 8, marginBottom: 20,
    borderWidth: 1, borderColor: '#FFD0B5',
  },
  progressBar: {
    height: 5, backgroundColor: '#FFD0B5', borderRadius: 10,
    overflow: 'hidden', marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 10 },
  row: { justifyContent: 'space-between', paddingHorizontal: 8 },
});