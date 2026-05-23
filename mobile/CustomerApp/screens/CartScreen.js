import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useCart } from '../context/CartContext';

const CartScreen = ({ navigation }) => {
  const { cart, removeFromCart } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Cart</Text>
        <View style={{ width: 50 }} />
      </View>
      {cart.length === 0 ? (
        <View style={styles.emptyContent}>
          <Text style={styles.icon}>🛒</Text>
          <Text style={styles.message}>Your cart is empty</Text>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price}</Text>
              <TouchableOpacity onPress={() => removeFromCart(item._id)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff',
  },
  backButton: { fontSize: 16, color: '#2196F3', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptyContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 64, marginBottom: 20 },
  message: { fontSize: 18, color: '#999' },
  cartItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 4, padding: 16, borderRadius: 12,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: '#333' },
  itemPrice: { fontSize: 16, color: '#2196F3', fontWeight: 'bold' },
  removeText: { color: '#f44336', fontWeight: '600' },
});

export default CartScreen;