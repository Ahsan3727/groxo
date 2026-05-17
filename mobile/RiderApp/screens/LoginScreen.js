import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSendOTP = () => setStep('otp');

  const handleVerifyOTP = async () => {
    setLoading(true);
    try {
      await login(phone, otp);
    } catch (e) {
      Alert.alert('Login failed', e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏍️ Groxo Rider</Text>
      {step === 'phone' ? (
        <>
          <TextInput style={styles.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TouchableOpacity style={styles.btn} onPress={handleSendOTP}>
            <Text style={styles.btnText}>Send OTP</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Enter OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
          {loading ? <ActivityIndicator size="large" color={Colors.primary} /> : (
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP}>
              <Text style={styles.btnText}>Verify OTP</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setStep('phone')}>
            <Text style={{ marginTop: 10, color: Colors.accent }}>Change number</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:Colors.background },
  title: { fontSize:28, fontWeight:'bold', marginBottom:30 },
  input: { width:'100%', backgroundColor:Colors.white, padding:14, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:Colors.lightGray },
  btn: { backgroundColor:Colors.primary, padding:14, borderRadius:8, width:'100%', alignItems:'center' },
  btnText: { color:Colors.white, fontWeight:'bold', fontSize:16 }
});
