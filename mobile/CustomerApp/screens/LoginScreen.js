import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Fonts } from '../theme/theme';
export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const handleSendOTP = () => setStep('otp');
  const handleVerifyOTP = async () => { setLoading(true); try { await login(phone, otp); } catch (error) { Alert.alert('Login Failed', error.response?.data?.message || error.message); } finally { setLoading(false); } };
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.appName}>🛒 Groxo</Text>
        <Text style={styles.tagline}>Fresh groceries delivered fast</Text>
        {step === 'phone' ? (
          <>
            <TextInput style={styles.input} placeholder="Enter your phone number" placeholderTextColor={Colors.gray} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TouchableOpacity style={styles.btn} onPress={handleSendOTP}><Text style={styles.btnText}>Send OTP</Text></TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput style={styles.input} placeholder="Enter OTP" placeholderTextColor={Colors.gray} value={otp} onChangeText={setOtp} keyboardType="number-pad" />
            {loading ? <ActivityIndicator size="large" color={Colors.primary} /> :
              <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP}><Text style={styles.btnText}>Verify OTP</Text></TouchableOpacity>
            }
            <TouchableOpacity onPress={() => setStep('phone')}><Text style={styles.changeNumber}>Change number</Text></TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  appName: { fontSize: 36, fontWeight: 'bold', color: Colors.primary },
  tagline: { color: Colors.gray, marginBottom: 32, fontSize: Fonts.body },
  input: { width: '100%', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 16, color: Colors.black },
  btn: { width: '100%', backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  btnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  changeNumber: { color: Colors.accent, marginTop: 8 },
});
