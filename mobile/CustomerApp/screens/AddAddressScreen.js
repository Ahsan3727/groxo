import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import api from '../services/api';
import { Colors } from '../theme/theme';
export default function AddAddressScreen({ navigation }) {
  const [label, setLabel] = useState(''); const [line1, setLine1] = useState(''); const [city, setCity] = useState(''); const [pincode, setPincode] = useState('');
  const save = async () => { await api.post('/users/addresses', { label, line1, city, pincode }); navigation.goBack(); };
  return (
    <View style={styles.container}>
      <TextInput placeholder="Label (Home/Work)" value={label} onChangeText={setLabel} style={styles.input} placeholderTextColor={Colors.gray} />
      <TextInput placeholder="Address line" value={line1} onChangeText={setLine1} style={styles.input} placeholderTextColor={Colors.gray} />
      <TextInput placeholder="City" value={city} onChangeText={setCity} style={styles.input} placeholderTextColor={Colors.gray} />
      <TextInput placeholder="Pincode" value={pincode} onChangeText={setPincode} style={styles.input} keyboardType="number-pad" placeholderTextColor={Colors.gray} />
      <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnText}>Save Address</Text></TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  input: { backgroundColor: Colors.white, padding: 14, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.lightGray, color: Colors.black },
  btn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
