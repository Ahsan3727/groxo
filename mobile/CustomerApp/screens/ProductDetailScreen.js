import React, { useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { useCart } from '../context/CartContext';
import AppButton from '../components/AppButton';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

const Colors = {
  primary: '#FF7F2A', primaryLight: '#FFF0E5', white: '#FFFFFF', gray100: '#f1f5f9',
  gray400: '#9CA3AF', gray600: '#475569', darkest: '#3E2723', orangeText: '#8B4513',
  heroBg: '#FF9F43', border: '#FFD0B5',
};

export default function ProductDetailScreen({ navigation, route }) {
  const { addToCart } = useCart();
  const product = route?.params?.product;
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backLink}>← Go back</Text></TouchableOpacity>
      </View>
    );
  }

  const displayPrice = product.adminPrice || product.price;

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      addToCart({ ...product, quantity });
      Alert.alert('Added to Cart', `${product.name} (x${quantity}) added!`);
      setAdding(false);
    }, 200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.imageContainer}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <Text style={styles.emoji}>{product.emoji || '🛍️'}</Text>
        )}
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDesc}>{product.description || 'Fresh and high-quality product.'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>Rs. {displayPrice?.toFixed(2)}</Text>
        </View>
        {product.category && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{product.category}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Availability</Text>
          <Text style={[styles.detailValue, { color: product.stock > 0 ? '#16a34a' : '#ef4444' }]}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
        <Text style={styles.sectionLabel}>Quantity</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(prev => Math.max(1, prev - 1))}>
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(prev => prev + 1)}>
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rs. {(displayPrice * quantity).toFixed(2)}</Text>
        </View>
        <AppButton title={adding ? 'Adding...' : 'Add to Cart'} onPress={handleAddToCart} loading={adding} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  scrollContent: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: Colors.gray400, marginBottom: 12 },
  backLink: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Constants.statusBarHeight + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  placeholder: { width: 44 },
  imageContainer: { alignItems: 'center', marginTop: 20, marginBottom: 20, backgroundColor: Colors.white, marginHorizontal: 20, borderRadius: Radius.lg, padding: 20, ...Shadows.md },
  image: { width: 200, height: 200, borderRadius: Radius.md },
  emoji: { fontSize: 80 },
  infoCard: { backgroundColor: Colors.white, marginHorizontal: 20, borderRadius: Radius.lg, padding: 24, ...Shadows.md },
  productName: { fontSize: 22, fontWeight: '800', color: Colors.darkest, marginBottom: 8 },
  productDesc: { fontSize: 14, color: Colors.orangeText, lineHeight: 20, marginBottom: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12 },
  priceLabel: { fontSize: 16, fontWeight: '600', color: Colors.darkest },
  priceValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 14, color: Colors.gray600 },
  detailValue: { fontSize: 14, fontWeight: '600', color: Colors.darkest },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: Colors.darkest, marginTop: 16, marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  qtyButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qtyButtonText: { fontSize: 20, fontWeight: '600', color: Colors.primary },
  qtyValue: { fontSize: 20, fontWeight: '700', color: Colors.darkest, minWidth: 30, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.darkest },
  totalValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
});