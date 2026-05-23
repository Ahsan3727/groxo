import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSignup = async () => {
    if (step === 1) {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        Alert.alert('Error', 'Please fill all personal details');
        return;
      }
      if (!password.trim() || password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      setStep(2);
      return;
    }

    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter your store name');
      return;
    }

    setLoading(true);
    const result = await signup(
      name.trim(), email.trim(), phone.trim(), password,
      storeName.trim(), businessLicense.trim()
    );
    setLoading(false);

    if (!result.success) {
      Alert.alert('Signup Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.appName}>🏭 Join as Wholesaler</Text>
          <Text style={styles.subtitle}>Create your business account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.stepIndicator}>
            <View style={[styles.step, step >= 1 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text>
            </View>
            <View style={styles.stepLine} />
            <View style={[styles.step, step >= 2 && styles.stepActive]}>
              <Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text>
            </View>
          </View>

          {step === 1 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput style={styles.input} placeholder="John Doe" value={name} onChangeText={setName} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput style={styles.input} placeholder="wholesaler@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput style={styles.input} placeholder="+1234567890" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password * (min. 6 characters)</Text>
                <TextInput style={styles.input} placeholder="••••••" value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput style={styles.input} placeholder="••••••" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.button} onPress={handleSignup}>
                <Text style={styles.buttonText}>Next → Business Details</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Store Name *</Text>
                <TextInput style={styles.input} placeholder="Your Store Name" value={storeName} onChangeText={setStoreName} />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business License</Text>
                <TextInput style={styles.input} placeholder="License number" value={businessLicense} onChangeText={setBusinessLicense} />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.button, styles.backButton]} onPress={() => setStep(1)}>
                  <Text style={styles.buttonText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.signupButton]} onPress={handleSignup} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#FF9800', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  form: { backgroundColor: '#fff', borderRadius: 12, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  step: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  stepActive: { backgroundColor: '#FF9800' },
  stepText: { fontSize: 16, fontWeight: 'bold', color: '#999' },
  stepTextActive: { color: '#fff' },
  stepLine: { width: 40, height: 2, backgroundColor: '#ddd', marginHorizontal: 8 },
  inputContainer: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#fafafa' },
  button: { backgroundColor: '#FF9800', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 10 },
  buttonRow: { flexDirection: 'row', gap: 12 },
  backButton: { backgroundColor: '#999', flex: 1 },
  signupButton: { flex: 2 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#666' },
  link: { fontSize: 14, color: '#FF9800', fontWeight: 'bold' },
});

export default SignupScreen;