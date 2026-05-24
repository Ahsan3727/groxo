import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import api from '../services/api';

const AddProductScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim() || !category.trim()) {
      Alert.alert('Required', 'Please fill in name, category, and price.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/products', {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: Number(price),
        stock: Number(stock) || 0,
      });
      Alert.alert('Success', 'Product added and sent for approval', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Product</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Fresh Mangoes" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Product description" multiline />

        <Text style={styles.label}>Category *</Text>
        <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Fruits, Vegetables..." />

        <Text style={styles.label}>Price (Wholesale) *</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="80" keyboardType="numeric" />

        <Text style={styles.label}>Stock</Text>
        <TextInput style={styles.input} value={stock} onChangeText={setStock} placeholder="100" keyboardType="numeric" />

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.6 }]}
          onPress={handleAddProduct}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Add Product</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 14, fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#FF9800', marginTop: 30, padding: 16, borderRadius: 10, alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default AddProductScreen;