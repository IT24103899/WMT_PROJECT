import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
// Removed Reanimated for stability

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#312e81']}
        style={styles.backgroundImage}
      >
        {/* Decorative Blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />

        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <LinearGradient colors={['#4f46e5', '#a855f7']} style={styles.logoGradient}>
                  <Ionicons name="library" size={50} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>E-Library</Text>
              <Text style={styles.subtitle}>Your Gateway to Infinite Knowledge</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.glassCard}>
                <Text style={styles.formTitle}>Welcome Back</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
                    <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor="#64748b"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#64748b"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                  <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.btnGradient} start={{x: 0, y:0}} end={{x: 1, y: 0}}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginBtnText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{marginLeft: 8}} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>New to E-Library? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <Text style={styles.footerLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1 },
  blob1: { position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: 175, backgroundColor: 'rgba(79, 70, 229, 0.25)' },
  blob2: { position: 'absolute', bottom: -50, left: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(168, 85, 247, 0.18)' },
  blob3: { position: 'absolute', top: '40%', left: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(56, 189, 248, 0.12)' },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 50 },
  header: { alignItems: 'center', marginBottom: 50 },
  logoWrapper: { width: 110, height: 110, borderRadius: 32, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.6, shadowRadius: 20, elevation: 20, marginBottom: 25 },
  logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  subtitle: { fontSize: 17, color: '#94a3b8', marginTop: 10, fontWeight: '600', opacity: 0.9 },
  formContainer: { flex: 1 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 40, padding: 32, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 },
  formTitle: { fontSize: 28, fontWeight: '900', color: '#0f172a', marginBottom: 35, textAlign: 'center', letterSpacing: -0.5 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 10, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 18 },
  inputWrapperError: { borderColor: '#ef4444' },
  inputIcon: { marginRight: 14 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  eyeIcon: { padding: 10 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 6, marginLeft: 8, fontWeight: '700' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 35 },
  forgotText: { color: '#4f46e5', fontWeight: '800', fontSize: 14 },
  loginBtn: { borderRadius: 22, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.5, shadowRadius: 15, elevation: 12 },
  btnGradient: { flexDirection: 'row', paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 35 },
  footerText: { color: '#64748b', fontSize: 16, fontWeight: '500' },
  footerLink: { color: '#4f46e5', fontWeight: '900', fontSize: 16 }
});
