import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function MyProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/products?wholesaler=me').then(res => setProducts(res.data.products || [])).catch(console.log);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 My Products</Text>
        <Text style={styles.addBtn} onPress={() => navigation.navigate('AddProduct')}>+ Add</Text>
      </View>
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No products yet</Text>}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>Wholesale Price: ₹{item.wholesalerPrice || item.price}</Text>
            <Text style={styles.productStatus}>Status: {item.status}</Text>
          </Card>
        )}
      />
      <BottomTabBar navigation={navigation} activeScreen="Products" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
  addBtn: { fontSize: 16, color: Colors.primary600, fontWeight: '600' },
  productCard: { marginBottom: 8 },
  productName: { fontWeight: '600', fontSize: 15 },
  productPrice: { color: Colors.gray500, marginTop: 4 },
  productStatus: { color: Colors.primary600, fontWeight: '600', marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});