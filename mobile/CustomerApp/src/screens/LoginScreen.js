import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../shared/hooks/useAuth';
import { colors } from '../../shared/constants/colors';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const { login, register } = useAuth();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await login(phone, password);
      } else {
        await register(phone, password, name);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Groxo</Text>
      {!isLogin && (
        <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
      )}
      <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleAuth}>
        <Text style={styles.btnText}>{isLogin ? 'Login' : 'Register'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={{ marginTop: 16, color: colors.primary }}>
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 32 },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: colors.primary },
  input: {
    backgroundColor: colors.card, padding: 16, borderRadius: 12, marginTop: 16, fontSize: 16, elevation: 2
  },
  btn: {
    backgroundColor: colors.primary, marginTop: 30, paddingVertical: 16, borderRadius: 30, alignItems: 'center'
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});

export default LoginScreen;
