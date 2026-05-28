import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';
import Card from '../components/Card';
import BottomTabBar from '../components/BottomTabBar';
import { Colors, Fonts } from '../theme';

export default function AddProductScreen({ navigation }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !category.trim()) {
      Alert.alert('Error', 'Name, category, and price are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/products', { name: name.trim(), description: description.trim(), category: category.trim(), price: Number(price), stock: Number(stock) || 0 });
      Alert.alert('Success', 'Product added and sent for approval', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to add product');
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <AppButton title="← Back" type="ghost" size="sm" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Add Product</Text>
          <View style={{ width: 40 }} />
        </View>
        <Card style={{ marginHorizontal: 16 }}>
          <InputGroup icon="📦" placeholder="Product Name" value={name} onChangeText={setName} />
          <InputGroup icon="📝" placeholder="Description" value={description} onChangeText={setDescription} />
          <InputGroup icon="🏷️" placeholder="Category (e.g. Fruits)" value={category} onChangeText={setCategory} />
          <InputGroup icon="💰" placeholder="Wholesale Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <InputGroup icon="📊" placeholder="Stock" value={stock} onChangeText={setStock} keyboardType="numeric" />
          <AppButton title="Add Product" loading={loading} onPress={handleAddProduct} style={{ marginTop: 16 }} />
        </Card>
      </ScrollView>
      <BottomTabBar navigation={navigation} activeScreen="Products" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.gray100 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 8, paddingBottom: 12, backgroundColor: Colors.white },
  title: { fontSize: Fonts.sizes.xl, fontWeight: '700' },
});