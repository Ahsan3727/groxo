import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import InputGroup from '../components/InputGroup';

// Warm, balanced orange palette
const Colors = {
  bgTop: '#FF9F43',        // warm orange header
  bgBottom: '#FFF6F0',     // soft cream background
  white: '#FFFFFF',
  cardBg: '#FFFFFF',
  lightOrange: '#FFF0E5',
  border: '#FFD0B5',
  orange500: '#FF7F2A',    // button color (used by AppButton primary)
  orange600: '#E6691C',
  orangeText: '#8B4513',
  darkest: '#3E2723',
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    // Call auth context: empty email, phone, password
    const result = await login('', phone.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Orange header area */}
        <View style={styles.headerBg}>
          <Text style={styles.appName}>GROXO</Text>
          <Text style={styles.subtitle}>Customer App</Text>
        </View>

        {/* White card */}
        <View style={styles.card}>
          <Text style={styles.welcome}>Welcome Back!</Text>

          {/* Phone input with +92 prefix */}
          <InputGroup
            icon="🇵🇰 +92"
            placeholder="300 1234567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {/* Password input */}
          <InputGroup
  icon="🔒"
  placeholder="Password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry={!showPassword}
  rightIcon={{
    icon: showPassword ? '🙈' : '👁️',   // emoji eye, or use a text symbol
    onPress: () => setShowPassword(!showPassword),
  }}
/>

          {/* Login Button */}
          <AppButton
            title="Login"
            loading={loading}
            onPress={handleLogin}
            style={{ marginTop: 8 }}
          />

          {/* OR Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign‑In Button (placeholder) */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={() =>
              Alert.alert('Coming Soon', 'Google login will be available soon!')
            }
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign‑up link */}
          <Text style={styles.footerText}>
            Don't have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('Signup')}
            >
              Create Account
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgBottom,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  headerBg: {
    backgroundColor: Colors.bgTop,
    paddingTop: 80,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFEDD5',
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: -30,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.darkest,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: Colors.orangeText,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lightOrange,
    borderRadius: 999,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: 8,
  },
  googleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.orangeText,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.orangeText,
  },
  link: {
    color: Colors.orange600,
    fontWeight: '700',
  },
});