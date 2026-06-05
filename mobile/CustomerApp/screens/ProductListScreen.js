import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import api from '../services/api';
import Card from '../components/Card';
import { Colors as GlobalColors, Fonts } from '../theme';

const Colors = {
  primary: '#FF7F2A', white: '#FFFFFF', gray100: '#f1f5f9', gray400: '#9CA3AF',
  darkest: '#3E2723', heroBg: '#FF9F43',
};

export default function ProductListScreen({ navigation, route }) {
  const category = route?.params?.category;
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get(`/products?category=${category}`).then(res => setProducts(res.data.products || [])).catch(console.error);
  }, [category]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No products in this category</Text>}
        renderItem={({ item }) => (
          <Card style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
            <Text style={styles.productEmoji}>{item.emoji || '🛍️'}</Text>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productPrice}>Rs. {(item.adminPrice || item.price).toFixed(2)}</Text>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF6F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.heroBg },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 24, color: '#FFFFFF', fontWeight: '600' },
  headerTitle: { fontSize: Fonts.sizes.xl, fontWeight: '700', color: '#FFFFFF' },
  productCard: { alignItems: 'center', marginBottom: 10 },
  productEmoji: { fontSize: 36, marginBottom: 8 },
  productName: { fontWeight: '600', fontSize: 14, color: Colors.darkest },
  productPrice: { fontWeight: '700', fontSize: 16, color: Colors.primary, marginTop: 4 },
  emptyText: { textAlign: 'center', marginTop: 40, color: Colors.gray400, fontSize: 16 },
});