import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  Dimensions, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      Alert.alert(
        'Account Created! 🎉', 
        `Welcome to E-Library! A welcome email has been sent to ${email.trim()}. Please login to continue.`,
        [
          { text: 'Open Email', onPress: () => Linking.openURL('mailto:') },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      Alert.alert('Registration Failed', msg);
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
        <View style={styles.blob1} />
        <View style={styles.blob2} />
        <View style={styles.blob3} />

        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Join Us</Text>
              <Text style={styles.subtitle}>Start your journey with E-Library</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.formContainer}>
              <View style={styles.glassCard}>
                <Text style={styles.formTitle}>Create Account</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputWrapper, errors.name && styles.inputWrapperError]}>
                    <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="John Doe"
                      placeholderTextColor="#64748b"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

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
                      placeholder="Min. 6 characters"
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

                <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
                  <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.btnGradient} start={{x: 0, y:0}} end={{x: 1, y: 0}}>
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.registerBtnText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

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
  blob3: { position: 'absolute', top: '40%', right: -50, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 40 },
  header: { marginBottom: 40 },
  backBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1.5 },
  subtitle: { fontSize: 17, color: '#94a3b8', marginTop: 8, fontWeight: '600', opacity: 0.9 },
  formContainer: { flex: 1 },
  glassCard: { backgroundColor: 'rgba(255, 255, 255, 0.98)', borderRadius: 40, padding: 32, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, elevation: 15 },
  formTitle: { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 30, textAlign: 'center', letterSpacing: -0.5 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 10, marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 18 },
  inputWrapperError: { borderColor: '#ef4444' },
  inputIcon: { marginRight: 14 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: '#0f172a', fontWeight: '600' },
  eyeIcon: { padding: 10 },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 6, marginLeft: 8, fontWeight: '700' },
  registerBtn: { borderRadius: 22, overflow: 'hidden', shadowColor: '#4f46e5', shadowOpacity: 0.5, shadowRadius: 15, elevation: 12, marginTop: 20 },
  btnGradient: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#64748b', fontSize: 15, fontWeight: '500' },
  footerLink: { color: '#4f46e5', fontWeight: '900', fontSize: 15 }
});
