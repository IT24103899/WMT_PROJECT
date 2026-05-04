import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword, resetPassword } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors, dark } = useTheme();
  
  // States
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      Alert.alert('Success', 'Verification code sent to your email!');
      setStep(2);
    } catch (err) {
      console.log('Forgot Password Request Error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Could not send verification code. Check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!token.trim() || !newPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase(), token.trim(), newPassword);
      Alert.alert('Success', 'Password reset successfully! You can now login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="key-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 1 
              ? "No worries! Enter your email and we'll send you a verification code."
              : `Enter the 6-digit code sent to ${email} and choose a new password.`}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email Address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleRequestCode}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Send Code</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="6-Digit Verification Code"
                placeholderTextColor={colors.textSecondary}
                value={token}
                onChangeText={setToken}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="New Password"
                placeholderTextColor={colors.textSecondary}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep(1)}>
              <Text style={[styles.resendText, { color: colors.primary }]}>Use a different email address</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.outlineBtn, { borderColor: colors.primary }]} 
              onPress={() => Linking.openURL('mailto:')}
            >
              <Ionicons name="mail-open-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.outlineBtnText, { color: colors.primary }]}>Open Email App</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 25, paddingTop: 60 },
  backBtn: { marginBottom: 30 },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  form: { gap: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 58, borderRadius: 16, borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  primaryBtn: { height: 58, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 2 },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  resendBtn: { marginTop: 20, alignItems: 'center' },
  resendText: { fontSize: 14, fontWeight: '700' },
  outlineBtn: { 
    height: 58, 
    borderRadius: 16, 
    borderWidth: 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 15,
    flexDirection: 'row'
  },
  outlineBtnText: { fontSize: 16, fontWeight: '800' }
});
