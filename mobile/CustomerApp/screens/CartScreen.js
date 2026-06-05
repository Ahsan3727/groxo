import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import Constants from 'expo-constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';   // still used for the map picker's API call wrapper
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import { Colors as GlobalColors, Fonts, Radius, Shadows } from '../theme';

const Colors = {
  primary: '#FF7F2A', primaryLight: '#FFF0E5', white: '#FFFFFF',
  gray100: '#f1f5f9', gray200: '#e2e8f0', gray400: '#9CA3AF',
  gray600: '#475569', darkest: '#3E2723', orangeText: '#8B4513',
  heroBg: '#FF9F43', border: '#FFD0B5', red: '#ef4444',
};

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, changeCartQuantity, clearCart, cartTotalItems } = useCart();
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.adminPrice || item.price) * item.quantity,
    0
  );
  const bagFee = 0.25;
  const serviceFee = 5.25;
  const deliveryFee = totalAmount > 500 ? 0 : 50;
  const grandTotal = totalAmount + bagFee + serviceFee + deliveryFee;

  // This function will be passed to the map picker to place the order
  const placeOrderApiCall = async (orderData) => {
    return api.post('/orders', orderData);
  };

  const handleGoToMap = () => {
    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Add some products first.');
      return;
    }
    const cartItems = cart.map(item => ({
      product: item._id,
      quantity: item.quantity,
    }));
    navigation.navigate('OrderMapPicker', {
      cartItems,
      apiFunc: placeOrderApiCall,
    });
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>0</Text></View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Browse products and add items you love!</Text>
          <AppButton title="Start Shopping" onPress={() => navigation.navigate('Home')} style={{ marginTop: 20 }} />
        </View>
        <BottomTabBar navigation={navigation} activeScreen="Cart" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{cartTotalItems()}</Text></View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {cart.map(item => {
          const itemTotal = (item.adminPrice || item.price) * item.quantity;
          return (
            <Card key={item._id} style={styles.cartItem}>
              <Text style={styles.itemEmoji}>{item.emoji || '🛍️'}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>Rs. {(item.adminPrice || item.price).toFixed(2)} each</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeCartQuantity(item._id, -1)}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeCartQuantity(item._id, 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemTotal}>Rs. {itemTotal.toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeBtn}>
                <Text style={styles.removeText}>🗑</Text>
              </TouchableOpacity>
            </Card>
          );
        })}

        {/* Order Summary (still shown) */}
        <Text style={styles.sectionTitle}>🧾 Order Summary</Text>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal ({cartTotalItems()} items)</Text><Text style={styles.summaryValue}>Rs. {totalAmount.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Bag Fee</Text><Text style={styles.summaryValue}>Rs. {bagFee.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service Fee</Text><Text style={styles.summaryValue}>Rs. {serviceFee.toFixed(2)}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={[styles.summaryValue, deliveryFee === 0 && { color: '#16a34a' }]}>{deliveryFee === 0 ? 'FREE' : `Rs. ${deliveryFee.toFixed(2)}`}</Text></View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>Rs. {grandTotal.toFixed(2)}</Text></View>
        </Card>

        {/* Place Order Button */}
        <View style={styles.buttonWrapper}>
          <AppButton
            title={loading ? 'Placing Order...' : 'Place Order (COD)'}
            onPress={handleGoToMap}
            loading={loading}
          />
          <Text style={styles.codNotice}>💵 Cash on Delivery · Pay when you receive</Text>
        </View>
      </ScrollView>

      <BottomTabBar navigation={navigation} activeScreen="Cart" />
    </View>
  );
}

// ---------- Styles (same as before, you can keep the existing styles) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Constants.statusBarHeight + 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, ...Shadows.sm, marginBottom: 8 },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  badge: { backgroundColor: Colors.red, minWidth: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.darkest, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.orangeText, textAlign: 'center', lineHeight: 20 },
  scrollView: { flex: 1 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, padding: 14 },
  itemEmoji: { fontSize: 36, width: 48, textAlign: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '600', fontSize: 14, color: Colors.darkest, marginBottom: 4 },
  itemPrice: { fontSize: 12, color: Colors.orangeText, marginBottom: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  qtyBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  qtyValue: { fontSize: 14, fontWeight: '700', color: Colors.darkest, minWidth: 20, textAlign: 'center' },
  itemTotal: { fontWeight: '700', fontSize: 15, color: Colors.darkest, marginLeft: 8 },
  removeBtn: { padding: 4, marginLeft: 8 },
  removeText: { fontSize: 18, color: Colors.red },
  sectionTitle: { fontSize: Fonts.sizes.lg, fontWeight: '700', color: Colors.darkest, marginBottom: 12, marginTop: 8 },
  summaryCard: { marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { fontSize: 14, color: Colors.gray600 },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.darkest },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: Colors.darkest },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  buttonWrapper: { marginTop: 8, marginBottom: 20 },
  codNotice: { textAlign: 'center', fontSize: 13, color: Colors.orangeText, marginTop: 10 },
});