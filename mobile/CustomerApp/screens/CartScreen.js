import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts, Radius, Shadows } from '../theme';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, clearCart, cartTotalItems } = useCart();
  const { customer } = useAuth();
  const [loading, setLoading] = useState(false);
  const totalAmount = cart.reduce((sum, item) => sum + (item.adminPrice || item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const orderItems = cart.map(item => ({ product: item._id, quantity: item.quantity }));
    setLoading(true);
    try {
      await api.post('/orders', {
        items: orderItems,
        deliveryAddress: { street: customer?.address?.street, city: customer?.address?.city },
        payment: { method: 'cod' },
      });
      Alert.alert('Order Placed', 'Your order has been placed!', [
        { text: 'OK', onPress: () => { clearCart(); navigation.navigate('Orders'); } }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to place order');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛒 My Cart</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{cartTotalItems()}</Text></View>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopLink}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 200 }}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <Text style={styles.itemEmoji}>{item.emoji || '🛍️'}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${(item.adminPrice || item.price).toFixed(2)} each</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity onPress={() => {/* TODO: add quantity reduction */}} style={styles.qtyBtn}>
                      <Text>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => {/* TODO: add quantity increase */}} style={styles.qtyBtn}>
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.itemTotal}>${((item.adminPrice || item.price) * item.quantity).toFixed(2)}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item._id)} style={styles.removeBtn}>
                  <Text style={styles.removeText}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}><Text>Subtotal</Text><Text>${totalAmount.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text>Bag Fee</Text><Text>$0.25</Text></View>
            <View style={styles.summaryRow}><Text>Service Fee</Text><Text>$5.25</Text></View>
            <View style={[styles.summaryRow, { color: Colors.primary600 }]}><Text>Delivery</Text><Text>FREE</Text></View>
            <View style={styles.summaryTotal}><Text style={{ fontWeight: '700' }}>Total</Text><Text style={{ fontWeight: '700', fontSize: 18 }}>${(totalAmount + 5.50).toFixed(2)}</Text></View>
          </View>

          <View style={styles.footer}>
            <AppButton title="Proceed to Checkout →" loading={loading} onPress={handlePlaceOrder} />
            <AppButton title="← Continue Shopping" type="outline" style={{ marginTop: 8 }} onPress={() => navigation.navigate('Home')} />
          </View>
        </>
      )}

      <BottomTabBar navigation={navigation} activeScreen="Cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Constants.statusBarHeight + 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: Colors.gray900 },
  badge: {
    backgroundColor: Colors.red,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: Colors.gray400, marginBottom: 15 },
  shopLink: { color: Colors.primary600, fontWeight: '600', fontSize: 16 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: Colors.gray200,
  },
  itemEmoji: { fontSize: 36, width: 44, textAlign: 'center' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontWeight: '600', fontSize: 13, color: Colors.gray900 },
  itemPrice: { fontSize: 11, color: Colors.gray400 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: { fontWeight: '600', fontSize: 13 },
  itemTotal: { fontWeight: '700', fontSize: 14, marginLeft: 12 },
  removeBtn: { marginLeft: 8, padding: 4 },
  removeText: { fontSize: 18, color: Colors.red },
  summaryBox: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.lg,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, fontSize: 13 },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: Colors.gray200,
    paddingTop: 10,
    marginTop: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
  },
});