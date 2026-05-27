import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, clearCart } = useCart();
  const { customer } = useAuth();
  const [loading, setLoading] = useState(false);
  const totalAmount = cart.reduce((sum, item) => sum + (item.adminPrice || item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    const orderItems = cart.map(item => ({ product: item._id, quantity: item.quantity }));
    setLoading(true);
    try {
      await api.post('/orders', { items: orderItems, deliveryAddress: { street: customer?.address?.street, city: customer?.address?.city }, payment: { method: 'cod' } });
      Alert.alert('Order Placed', 'Your order has been placed successfully!', [{ text: 'OK', onPress: () => { clearCart(); navigation.navigate('Orders'); } }]);
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Failed to place order'); } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Back</Text></TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 40 }} />
      </View>
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={styles.shopLink}>Continue Shopping</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '600', fontSize: 15 }}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFromCart(item._id)}><Text style={{ color: Colors.red }}>Remove</Text></TouchableOpacity>
              </View>
              <Text style={{ color: Colors.gray500, marginTop: 4 }}>Qty: {item.quantity} × ₹{item.adminPrice || item.price}</Text>
              <Text style={{ fontWeight: '700', marginTop: 4 }}>₹{(item.adminPrice || item.price) * item.quantity}</Text>
            </Card>
          )}
        />
      )}
      {cart.length > 0 && (
        <View style={styles.footer}>
          <Text style={{ fontSize: Fonts.sizes.lg, fontWeight: '700' }}>Total: ₹{totalAmount}</Text>
          <AppButton title="Place Order" loading={loading} onPress={handlePlaceOrder} />
        </View>
      )}
      <BottomTabBar navigation={navigation} activeScreen="Cart" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: Colors.white },
  backBtn: { fontSize: 16, color: Colors.primary600, fontWeight: '600' },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: Colors.gray400, marginBottom: 15 },
  shopLink: { color: Colors.primary600, fontWeight: '600', fontSize: 16 },
  footer: { position: 'absolute', bottom: 70, left: 16, right: 16, backgroundColor: Colors.white, padding: 16, borderRadius: Radius.lg, ...Shadows.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
