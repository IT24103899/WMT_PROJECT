import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { submitFeedback } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const TYPES = [
  { value: 'bug', label: 'Bug Report', icon: 'bug', color: '#ef4444', desc: 'Something is broken' },
  { value: 'feature', label: 'Suggestion', icon: 'bulb', color: '#f59e0b', desc: 'I have an idea' },
  { value: 'general', label: 'General', icon: 'chatbubble', color: '#3b82f6', desc: 'Just saying hi' },
];

export default function FeedbackScreen({ navigation }) {
  const { user } = useAuth();
  const [type, setType] = useState('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!message.trim()) e.message = 'Please share your thoughts';
    if (type === 'general' && rating === 0) e.rating = 'Pick a star';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await submitFeedback(type, message.trim(), rating, user?._id);
      setSubmitted(true);
    } catch (err) {
      Alert.alert('Oops!', err.response?.data?.message || 'Connection lost. Try again?');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#1e1b4b', '#312e81']} style={StyleSheet.absoluteFill} />
        <View style={styles.successCard}>
          <View style={styles.successIconBg}>
            <Ionicons name="checkmark-circle" size={80} color="#10b981" />
          </View>
          <Text style={styles.successTitle}>Washed in Gold! ✨</Text>
          <Text style={styles.successDesc}>
            Your feedback has been beamed to our team. We'll use it to make the E-Library even better.
          </Text>
          <TouchableOpacity 
            style={styles.doneBtn} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#f8fafc', '#e2e8f0']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerBox}>
             <Text style={styles.headerTitle}>We Value Your Voice</Text>
             <Text style={styles.headerSub}>Every thought counts towards perfection.</Text>
          </View>

          {/* Type Grid */}
          <Text style={styles.label}>What's on your mind?</Text>
          <View style={styles.typeGrid}>
            {TYPES.map((t) => {
              const isActive = type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard, 
                    isActive && { borderColor: t.color, backgroundColor: '#fff' }
                  ]}
                  onPress={() => {
                    setType(t.value);
                    setErrors({}); // Clear errors when switching
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIconBox, { backgroundColor: isActive ? t.color : '#f1f5f9' }]}>
                    <Ionicons name={isActive ? t.icon : t.icon + '-outline'} size={24} color={isActive ? '#fff' : '#64748b'} />
                  </View>
                  <Text style={[styles.typeLabel, isActive && { color: t.color, fontWeight: '900' }]}>{t.label}</Text>
                  {isActive && <View style={[styles.activeDot, { backgroundColor: t.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Star Rating — Only show for General Feedback */}
          {type === 'general' && (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Experience Rating</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => { setRating(star); setErrors((e) => ({ ...e, rating: undefined })); }}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={38}
                      color={star <= rating ? '#fbbf24' : '#e2e8f0'}
                      style={{ marginHorizontal: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
            </View>
          )}

          {/* Message Area */}
          <View style={[styles.card, errors.message && { borderColor: '#ef4444', borderWidth: 1 }]}>
            <Text style={styles.cardLabel}>Your Message</Text>
            <TextInput
              style={styles.input}
              placeholder={type === 'bug' ? "What went wrong?" : type === 'feature' ? "What should we add?" : "Tell us more..."}
              placeholderTextColor="#94a3b8"
              value={message}
              onChangeText={(t) => { setMessage(t); setErrors((e) => ({ ...e, message: undefined })); }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{message.length} / 500</Text>
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit} 
            disabled={submitting}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={['#1e1b4b', '#4338ca']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Transmit Feedback</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 40 },
  headerBox: { marginBottom: 30 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  headerSub: { fontSize: 15, color: '#64748b', marginTop: 4, fontWeight: '500' },
  label: { fontSize: 14, fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', marginBottom: 15, letterSpacing: 0.5 },
  typeGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  typeCard: { flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, position: 'relative' },
  typeIconBox: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  typeLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  activeDot: { position: 'absolute', top: 10, right: 10, width: 6, height: 6, borderRadius: 3 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 15 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 10 },
  input: { fontSize: 16, color: '#1e293b', fontWeight: '500', minHeight: 120, lineHeight: 24 },
  charCount: { textAlign: 'right', fontSize: 11, color: '#cbd5e1', marginTop: 8 },
  errorText: { color: '#ef4444', fontSize: 12, textAlign: 'center', marginTop: 5, fontWeight: '600' },
  submitBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 10, shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  submitGradient: { paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  // Success State
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successCard: { backgroundColor: '#fff', borderRadius: 40, padding: 40, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30, elevation: 20 },
  successIconBg: { marginBottom: 20 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  successDesc: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 22, fontWeight: '500' },
  doneBtn: { backgroundColor: '#1e293b', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20, marginTop: 30 },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' }
});
