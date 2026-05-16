import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useCart } from '../../shared/context/CartContext';
import { colors } from '../../shared/constants/colors';

const CartScreen = ({ navigation }) => {
  const { cartItems, removeFromCart, updateQuantity, totalAmount } = useCart();

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>
          ${item.product.price.toFixed(2)} each
        </Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.product._id, item.quantity - 1)}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.lineTotal}>
        ${(item.product.price * item.quantity).toFixed(2)}
      </Text>
      <TouchableOpacity
        onPress={() => removeFromCart(item.product._id)}
        style={styles.removeBtn}
      >
        <Text style={{ color: colors.danger, fontWeight: '600' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={{ fontSize: 18, color: colors.textSecondary }}>
            Your cart is empty
          </Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.product._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${totalAmount.toFixed(2)}</Text>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            cartItems.length === 0 && { backgroundColor: '#ccc' },
          ]}
          disabled={cartItems.length === 0}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    marginVertical: 6,
    borderRadius: 12,
    elevation: 2,
  },
  itemName: { fontWeight: '600', fontSize: 16 },
  itemPrice: { color: colors.textSecondary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: { color: '#fff', fontWeight: 'bold' },
  qtyValue: { marginHorizontal: 12, fontSize: 16, fontWeight: '600' },
  lineTotal: {
    fontWeight: 'bold',
    color: colors.secondary,
    marginHorizontal: 12,
    fontSize: 16,
  },
  removeBtn: { padding: 8 },
  footer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  total: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  checkoutBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default CartScreen;
