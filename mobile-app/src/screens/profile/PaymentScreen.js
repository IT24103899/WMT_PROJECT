import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PaymentScreen({ navigation }) {
  const { user, token, refreshUser } = useAuth();
  const { colors, dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(user?.isPremium || false);

  useEffect(() => {
    // Check latest status
    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}payments/status/${user._id}`);
        const data = await res.json();
        if (data.success) {
          setIsPremium(data.isPremium);
        }
      } catch (err) {
        console.error("Failed to check status", err);
      }
    };
    if (user?._id) checkStatus();
  }, [user?._id]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}payments/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user._id })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Elite Membership", "Welcome to the Elite! Your premium features are now active.");
        setIsPremium(true);
        if(refreshUser) await refreshUser();
      } else {
        Alert.alert("Upgrade Error", data.message || "Failed to process upgrade.");
      }
    } catch (err) {
      Alert.alert("Connectivity Issue", "Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[dark ? '#1e1b4b' : '#4338ca', dark ? '#0f172a' : '#1e1b4b']}
        style={styles.topHeader}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="crown" size={60} color="#fbbf24" style={styles.headerIcon} />
        <Text style={styles.mainTitle}>Elite Experience</Text>
        <Text style={styles.mainSubtitle}>The library has never felt this premium.</Text>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: dark ? '#ffffff10' : '#00000005' }]}>
          <View style={styles.statusSection}>
            <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Active Membership</Text>
            <LinearGradient
              colors={isPremium ? ['#fbbf24', '#f59e0b'] : ['#94a3b8', '#64748b']}
              style={styles.planBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.planText}>{isPremium ? 'PREMIER ELITE' : 'STANDARD'}</Text>
            </LinearGradient>
          </View>

          {!isPremium ? (
            <View style={styles.offerContent}>
              <View style={styles.priceTag}>
                <Text style={[styles.currency, { color: colors.text }]}>$</Text>
                <Text style={[styles.amount, { color: colors.text }]}>4.99</Text>
                <Text style={[styles.period, { color: colors.textSecondary }]}>/ month</Text>
              </View>

              <View style={styles.divider} />

              <Text style={[styles.benefitsTitle, { color: colors.text }]}>Exclusive Benefits</Text>
              
              <View style={styles.benefitList}>
                {[
                  { icon: 'infinity', text: 'Unlimited Offline Downloads' },
                  { icon: 'shield-check', text: 'Ad-Free Pure Reading' },
                  { icon: 'sparkles', text: 'Advanced AI Recommendations' },
                  { icon: 'crown-outline', text: 'Early Access to New Titles' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.benefitItem}>
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary + '20' }]}>
                      <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
                    </View>
                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{item.text}</Text>
                  </View>
                ))}
              </View>

              <Pressable 
                style={({ pressed }) => [
                  styles.upgradeButton, 
                  { backgroundColor: colors.primary },
                  pressed && styles.buttonPressed
                ]} 
                onPress={handleUpgrade}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="credit-card-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.upgradeBtnText}>Upgrade to Elite</Text>
                  </>
                )}
              </Pressable>
              
              <Text style={styles.cancelNote}>Cancel anytime. No hidden fees.</Text>
            </View>
          ) : (
            <View style={styles.premiumSuccess}>
              <View style={styles.successCircle}>
                <MaterialCommunityIcons name="check-decagram" size={60} color="#10b981" />
              </View>
              <Text style={[styles.successTitle, { color: colors.text }]}>Elite Status Active</Text>
              <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                Enjoy your exclusive library access. All features are fully unlocked.
              </Text>
              
              <View style={styles.perksGrid}>
                <View style={[styles.perkCard, { backgroundColor: colors.background }]}>
                  <MaterialCommunityIcons name="cloud-download" size={24} color={colors.primary} />
                  <Text style={[styles.perkText, { color: colors.textSecondary }]}>Offline Mode</Text>
                </View>
                <View style={[styles.perkCard, { backgroundColor: colors.background }]}>
                  <MaterialCommunityIcons name="robot" size={24} color={colors.primary} />
                  <Text style={[styles.perkText, { color: colors.textSecondary }]}>Smart AI</Text>
                </View>
              </View>
            </View>
          )}
        </View>
        
        <View style={styles.supportFooter}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Need help with your subscription?</Text>
          <Pressable><Text style={[styles.supportLink, { color: colors.primary }]}>Contact Elite Support</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topHeader: { padding: 30, paddingTop: 60, paddingBottom: 60, alignItems: 'center' },
  backButton: { position: 'absolute', top: 60, left: 20, zIndex: 10 },
  headerIcon: { marginBottom: 15 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 5 },
  mainSubtitle: { fontSize: 14, color: '#ffffff90', textAlign: 'center' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  card: { 
    borderRadius: 30, 
    padding: 25, 
    marginTop: -40,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  statusSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  statusLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  planBadge: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  planText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  offerContent: { alignItems: 'center' },
  priceTag: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 },
  currency: { fontSize: 24, fontWeight: '700', marginRight: 4 },
  amount: { fontSize: 48, fontWeight: '900' },
  period: { fontSize: 16, fontWeight: '600', marginLeft: 6 },
  divider: { width: '100%', height: 1, backgroundColor: '#f1f5f9', marginBottom: 25 },
  benefitsTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, alignSelf: 'flex-start' },
  benefitList: { width: '100%', gap: 18, marginBottom: 35 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  checkCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  benefitText: { fontSize: 15, fontWeight: '600' },
  upgradeButton: { width: '100%', height: 65, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  upgradeBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  buttonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cancelNote: { marginTop: 15, fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  premiumSuccess: { alignItems: 'center', paddingVertical: 10 },
  successCircle: { marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '900', marginBottom: 10 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30, paddingHorizontal: 20 },
  perksGrid: { flexDirection: 'row', gap: 15 },
  perkCard: { padding: 20, borderRadius: 20, alignItems: 'center', width: (width - 110) / 2, gap: 10 },
  perkText: { fontSize: 12, fontWeight: '700' },
  supportFooter: { marginTop: 30, alignItems: 'center', gap: 5 },
  footerText: { fontSize: 13, fontWeight: '600' },
  supportLink: { fontSize: 13, fontWeight: '800' }
});

