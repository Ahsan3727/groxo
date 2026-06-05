import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import api from '../services/api';

const MyProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // The backend can filter products by wholesaler if needed.
      // For now, fetch all products and filter on client side (or add backend endpoint)
      const { data } = await api.get('/products?wholesaler=me');
      // If backend doesn't support filtering, you can fetch all and filter:
      // const { data } = await api.get('/products');
      // setProducts(data.products.filter(p => p.wholesaler === currentWholesalerId));
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>Wholesale Price: ₹{item.wholesalerPrice || item.price}</Text>
      <Text style={styles.status}>Status: {item.status}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddProduct')}>
          <Text style={styles.addBtn}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#FF9800" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No products yet</Text>}
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
  backBtn: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold' },
  addBtn: { fontSize: 16, color: '#FF9800', fontWeight: '600' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 10,
    elevation: 1,
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { marginTop: 4, color: '#666' },
  status: { marginTop: 4, color: '#FF9800', fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});

export default MyProductsScreen;