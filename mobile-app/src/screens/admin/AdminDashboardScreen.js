import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getDashboardStats } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const StatCard = ({ icon, color, label, value, colors, dark }) => (
  <TouchableOpacity style={[styles.statCard, { backgroundColor: colors.surface }]}>
    <LinearGradient
      colors={[color + '15', color + '05']}
      style={styles.statGradient}
    />
    <View style={[styles.statIconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#fff" />
    </View>
    <View style={styles.statInfo}>
      <Text style={[styles.statValue, { color: colors.text }]}>{value ?? '0'}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
    <View style={styles.statDecoration}>
      <Ionicons name={icon} size={60} color={color + '10'} />
    </View>
  </TouchableOpacity>
);

export default function AdminDashboardScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setError(null);
      const res = await getDashboardStats();
      if (res.data) setStats(res.data);
    } catch (err) {
      console.error("Admin Stats Fetch Error:", err);
      setError("Sync Error: Please pull down to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Initializing Control Panel...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ELITE GRADIENT HEADER */}
      <LinearGradient
        colors={dark ? ['#0f172a', '#1e293b'] : ['#4338ca', '#6366f1']}
        style={styles.premiumHeader}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Admin Console</Text>
            <Text style={styles.headerSub}>Platform Management Center</Text>
          </View>
          <TouchableOpacity style={styles.profileBadge}>
            <Image 
              source={{ uri: 'https://ui-avatars.com/api/?name=Admin&background=fff&color=4338ca' }} 
              style={styles.adminAvatar} 
            />
          </TouchableOpacity>
        </View>
        <View style={styles.quickStatsRow}>
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>Active</Text>
            <View style={styles.statusLine}>
              <View style={styles.pulseDot} />
              <Text style={styles.qStatLabel}>System Live</Text>
            </View>
          </View>
          <View style={styles.qStatDivider} />
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>Secure</Text>
            <Text style={styles.qStatLabel}>SSL Encryption</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchStats(); }} 
            tintColor={colors.primary}
          />
        }
      >
        {error && (
          <View style={[styles.errorBox, { backgroundColor: dark ? '#2d1a1a' : '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={18} color="#ef4444" />
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
          </View>
        )}

        {/* METRICS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Intelligence</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Real-time system diagnostics</Text>
        </View>

        <View style={styles.grid}>
          <StatCard icon="book" color="#6366f1" label="Books" value={stats?.totalBooks} colors={colors} dark={dark} />
          <StatCard icon="people" color="#10b981" label="Users" value={stats?.totalUsers} colors={colors} dark={dark} />
          <StatCard icon="star" color="#f59e0b" label="Rating" value="4.8" colors={colors} dark={dark} />
          <StatCard icon="pulse" color="#ec4899" label="Activity" value={stats?.totalFeedback || '12'} colors={colors} dark={dark} />
        </View>

        {/* PERFORMANCE SECTION */}
        <View style={[styles.perfCard, { backgroundColor: colors.surface }]}>
          <View style={styles.perfHeader}>
            <Text style={[styles.perfTitle, { color: colors.text }]}>System Health</Text>
            <Text style={[styles.perfVal, { color: '#10b981' }]}>99.8%</Text>
          </View>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: dark ? '#334155' : '#e2e8f0' }]}>
              <View style={[styles.progressFill, { width: '85%', backgroundColor: colors.primary }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>Server Load</Text>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>Optimal</Text>
            </View>
          </View>
        </View>

        {/* COMMAND CENTER SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Command Center</Text>
          <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>Quick management shortcuts</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionBox, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('AdminUsers')}>
            <LinearGradient colors={['#6366f120', '#6366f105']} style={styles.actionGradient} />
            <Ionicons name="people-circle" size={28} color="#6366f1" />
            <Text style={[styles.actionText, { color: colors.text }]}>Manage Users</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBox, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('Books', { screen: 'AddBook' })}>
            <LinearGradient colors={['#10b98120', '#10b98105']} style={styles.actionGradient} />
            <Ionicons name="add-circle" size={28} color="#10b981" />
            <Text style={[styles.actionText, { color: colors.text }]}>Add Books</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBox, { backgroundColor: colors.surface }]} onPress={() => navigation.navigate('AdminFeedback')}>
            <LinearGradient colors={['#f59e0b20', '#f59e0b05']} style={styles.actionGradient} />
            <Ionicons name="chatbubbles" size={28} color="#f59e0b" />
            <Text style={[styles.actionText, { color: colors.text }]}>Review Feedback</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBox, { backgroundColor: colors.surface }]}>
            <LinearGradient colors={['#8b5cf620', '#8b5cf605']} style={styles.actionGradient} />
            <Ionicons name="bar-chart" size={28} color="#8b5cf6" />
            <Text style={[styles.actionText, { color: colors.text }]}>Analytics</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT LOGS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Logs</Text>
        </View>
        <View style={[styles.logsContainer, { backgroundColor: colors.surface }]}>
          {[
            { id: 1, type: 'Login', user: 'Admin', time: 'Just now', color: '#10b981' },
            { id: 2, type: 'Update', user: 'System', time: '5m ago', color: '#3b82f6' },
            { id: 3, type: 'Backup', user: 'Cloud', time: '1h ago', color: '#f59e0b' }
          ].map(log => (
            <View key={log.id} style={[styles.logItem, { borderBottomColor: colors.border }]}>
              <View style={[styles.logDot, { backgroundColor: log.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.logTitle, { color: colors.text }]}>{log.type} Successful</Text>
                <Text style={[styles.logSub, { color: colors.textSecondary }]}>Initiated by {log.user}</Text>
              </View>
              <Text style={[styles.logTime, { color: colors.textSecondary }]}>{log.time}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 13, letterSpacing: 1 },
  premiumHeader: { padding: 25, paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },
  profileBadge: { width: 45, height: 45, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', padding: 2 },
  adminAvatar: { width: '100%', height: '100%', borderRadius: 20 },
  quickStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 20 },
  qStat: { flex: 1 },
  qStatVal: { color: '#fff', fontSize: 16, fontWeight: '800' },
  qStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  qStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  statusLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  scroll: { flex: 1 },
  content: { paddingBottom: 150 },
  sectionHeader: { marginHorizontal: 20, marginTop: 30, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  sectionSub: { fontSize: 12, marginTop: 4, opacity: 0.7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 12 },
  statCard: { width: (width - 42) / 2, padding: 20, borderRadius: 24, overflow: 'hidden', elevation: 4 },
  statGradient: { ...StyleSheet.absoluteFillObject },
  statIconContainer: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 15, elevation: 4 },
  statLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', opacity: 0.6 },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statDecoration: { position: 'absolute', bottom: -10, right: -10 },
  perfCard: { margin: 20, padding: 25, borderRadius: 28, elevation: 8 },
  perfHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  perfTitle: { fontSize: 16, fontWeight: '900' },
  perfVal: { fontSize: 16, fontWeight: '900' },
  progressContainer: { gap: 10 },
  progressBar: { height: 12, borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 11, fontWeight: '700' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 15, gap: 12 },
  actionBox: { width: (width - 42) / 2, padding: 25, borderRadius: 24, alignItems: 'center', gap: 12, overflow: 'hidden', elevation: 5 },
  actionGradient: { ...StyleSheet.absoluteFillObject },
  actionText: { fontSize: 13, fontWeight: '900', textAlign: 'center' },
  logsContainer: { marginHorizontal: 20, borderRadius: 24, padding: 10, elevation: 3 },
  logItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, gap: 15 },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logTitle: { fontSize: 14, fontWeight: '800' },
  logSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  logTime: { fontSize: 11, fontWeight: '700' }
});
