import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart, clearCart } = useCart();
  const { customer } = useAuth();

  // Simple address form state
  const [street, setStreet] = useState(customer?.address?.street || '');
  const [city, setCity] = useState(customer?.address?.city || '');
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce(
    (sum, item) => sum + (item.adminPrice || item.price) * item.quantity,
    0
  );

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Cart empty', 'Add some products first.');
      return;
    }

    if (!street.trim() || !city.trim()) {
      Alert.alert('Missing address', 'Please enter your delivery street and city.');
      return;
    }

    const orderItems = cart.map(item => ({
      product: item._id,
      quantity: item.quantity,
      price: item.adminPrice || item.price,
    }));

    setLoading(true);
    try {
      await api.post('/orders', {
        items: orderItems,
        deliveryAddress: {
          street,
          city,
          state: '',    // you can add more fields if needed
          zip: '',
        },
        payment: { method: 'cod' }, // default cash on delivery
      });

      Alert.alert('Order Placed', 'Your order has been placed successfully!', [
        { text: 'OK', onPress: () => {
          clearCart();
          navigation.navigate('Orders');
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
      <Text style={styles.itemPrice}>₹{(item.adminPrice || item.price) * item.quantity}</Text>
      <TouchableOpacity onPress={() => removeFromCart(item._id)}>
        <Text style={styles.removeBtn}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (cart.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Your cart is empty</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.shopLink}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 50 }} />
      </View>

      <FlatList
        data={cart}
        keyExtractor={item => item._id}
        renderItem={renderCartItem}
        style={styles.list}
      />

      {/* Delivery Address Form */}
      <View style={styles.addressSection}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Street"
          value={street}
          onChangeText={setStreet}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
      </View>

      {/* Total & Place Order */}
      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ₹{totalAmount}</Text>
        <TouchableOpacity
          style={[styles.orderBtn, loading && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.orderBtnText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff',
  },
  backBtn: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  list: { flex: 1, padding: 16 },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8,
  },
  itemName: { flex: 2, fontSize: 15, fontWeight: '500' },
  itemQty: { flex: 1, fontSize: 14, color: '#666' },
  itemPrice: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#2196F3' },
  removeBtn: { color: '#f44336', fontWeight: '600', marginLeft: 10 },
  addressSection: { padding: 16, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 10, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10,
    marginBottom: 8, fontSize: 14,
  },
  footer: {
    padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee',
  },
  totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  orderBtn: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center',
  },
  orderBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, color: '#999', marginBottom: 15 },
  shopLink: { color: '#2196F3', fontWeight: '600', fontSize: 16 },
});

export default CartScreen;