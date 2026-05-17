import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useWholesaler } from '../context/WholesalerContext';
import { Colors, Shadows } from '../theme/theme';

export default function ProductManagementScreen() {
  const { products, addProduct, updateStock, deleteProduct } = useWholesaler();
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', stock: '', category: '' });

  const handleAdd = () => {
    if (!newProduct.name) return;
    addProduct({ ...newProduct, price: parseFloat(newProduct.price) || 0, stock: parseInt(newProduct.stock) || 0 });
    setNewProduct({ name: '', price: '', stock: '', category: '' });
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
        <Text style={styles.addBtnText}>+ Add Product</Text>
      </TouchableOpacity>

      {showAdd && (
        <View style={styles.addForm}>
          <TextInput placeholder="Name" value={newProduct.name} onChangeText={t => setNewProduct({ ...newProduct, name: t })} style={styles.input} />
          <TextInput placeholder="Price" value={newProduct.price} onChangeText={t => setNewProduct({ ...newProduct, price: t })} style={styles.input} keyboardType="numeric" />
          <TextInput placeholder="Stock" value={newProduct.stock} onChangeText={t => setNewProduct({ ...newProduct, stock: t })} style={styles.input} keyboardType="numeric" />
          <TextInput placeholder="Category" value={newProduct.category} onChangeText={t => setNewProduct({ ...newProduct, category: t })} style={styles.input} />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveBtnText}>Save Product</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text>?{item.price} | Stock: {item.stock} | Status: {item.status}</Text>
            <View style={styles.productActions}>
              <TouchableOpacity onPress={() => {
                const newStock = prompt('New stock quantity:', item.stock.toString());
                if (newStock) updateStock(item._id, parseInt(newStock) || 0);
              }}>
                <Text style={styles.actionLink}>Update Stock</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteProduct(item._id)}>
                <Text style={[styles.actionLink, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, padding:12, backgroundColor:Colors.background },
  addBtn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  addBtnText: { color:Colors.white, fontWeight:'bold' },
  addForm: { backgroundColor:Colors.white, padding:12, borderRadius:8, marginBottom:12 },
  input: { borderWidth:1, borderColor:Colors.lightGray, padding:10, borderRadius:6, marginBottom:8 },
  saveBtn: { backgroundColor:Colors.accent, padding:12, borderRadius:6, alignItems:'center' },
  saveBtnText: { color:Colors.white, fontWeight:'bold' },
  productCard: { backgroundColor:Colors.white, padding:14, borderRadius:8, marginBottom:8, ...Shadows.light },
  productName: { fontWeight:'bold', fontSize:16 },
  productActions: { flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  actionLink: { fontWeight:'bold', color:Colors.primary }
});
