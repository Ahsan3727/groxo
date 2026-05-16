import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useCart } from '../../shared/context/CartContext';
import { colors } from '../../shared/constants/colors';
import API from '../../shared/services/api';

const CheckoutScreen = ({ navigation }) => {
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const { cartItems, totalAmount, clearCart } = useCart();

  const placeOrder = async () => {
    if (!address) {
      Alert.alert('Please enter delivery address');
      return;
    }
    if (cartItems.length === 0) {
      Alert.alert('Cart is empty');
      return;
    }

    try {
      // Build items array for the API
      const orderItems = cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      // For now use a dummy wholesalerId (in real app, products belong to a specific wholesaler)
      const wholesalerId = cartItems[0]?.product?.wholesaler;

      await API.post('/orders', {
        wholesalerId,
        items: orderItems,
        deliveryAddress: { address, lat: 0, lng: 0 },
        paymentMethod,
      });

      Alert.alert('Success', 'Order placed successfully!', [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.navigate('Orders');
          },
        },
      ]);
    } catch (err) {
      Alert.alert(
        'Order failed',
        err.response?.data?.message || 'Please try again'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Delivery Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter full address"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Payment Method</Text>
      <TouchableOpacity
        style={styles.radioRow}
        onPress={() => setPaymentMethod('cod')}
      >
        <View
          style={[
            styles.radio,
            paymentMethod === 'cod' && styles.radioSelected,
          ]}
        />
        <Text>Cash on Delivery</Text>
      </TouchableOpacity>

      <Text style={[styles.label, { marginTop: 24 }]}>Order Summary</Text>
      {cartItems.map((item) => (
        <View key={item.product._id} style={styles.summaryRow}>
          <Text>
            {item.product.name} x {item.quantity}
          </Text>
          <Text>${(item.product.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.summaryRow}>
        <Text style={{ fontWeight: 'bold' }}>Total</Text>
        <Text style={{ fontWeight: 'bold', color: colors.secondary }}>
          ${totalAmount.toFixed(2)}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.placeBtn, { marginTop: 30 }]}
        onPress={placeOrder}
      >
        <Text style={styles.placeText}>Place Order</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  input: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    fontSize: 16,
  },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 12,
  },
  radioSelected: { backgroundColor: colors.primary },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  placeBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  placeText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default CheckoutScreen;
