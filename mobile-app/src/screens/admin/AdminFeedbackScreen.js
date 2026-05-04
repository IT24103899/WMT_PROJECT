import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFeedback, updateFeedbackStatus } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const TYPE_ICONS = { 'Bug Report': 'bug-outline', 'Feature Request': 'bulb-outline', General: 'chatbubble-outline' };
const STATUS_COLORS = { pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };
const FILTER_OPTS = ['All', 'pending', 'approved', 'rejected'];

export default function AdminFeedbackScreen() {
  const { colors, dark } = useTheme();
  const [feedback, setFeedback] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchFeedback = useCallback(async () => {
    try {
      const res = await getFeedback();
      const data = res.data || [];
      setFeedback(data);
      applyFilter(data, statusFilter);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter]);

  const applyFilter = (data, filter) => {
    if (filter === 'All') { setFiltered(data); return; }
    setFiltered(data.filter((f) => f.status === filter));
  };

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  const handleFilterChange = (f) => {
    setStatusFilter(f);
    applyFilter(feedback, f);
  };

  const handleAction = (id, action) => {
    const label = action === 'approved' ? 'Approve' : 'Reject';
    Alert.alert(`${label} Feedback`, `${label} this feedback submission?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: label, onPress: async () => {
          try {
            await updateFeedbackStatus(id, action);
            fetchFeedback();
          } catch (_) { Alert.alert('Error', 'Could not update feedback status'); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : colors.primary }]}>
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Ionicons name={TYPE_ICONS[item.type] || 'chatbubble-outline'} size={16} color={colors.primary} />
          <Text style={[styles.typeText, { color: colors.primary }]}>{item.type || 'General'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.textSecondary) + '15' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.textSecondary }]}>
            {item.status || 'pending'}
          </Text>
        </View>
      </View>

      <Text style={[styles.message, { color: colors.text }]}>{item.message}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons key={n} name={n <= (item.rating || 0) ? 'star' : 'star-outline'} size={13} color="#f59e0b" />
          ))}
          <Text style={[styles.ratingNum, { color: colors.textSecondary }]}>({item.rating || 0}/5)</Text>
        </View>
        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.user?.name || item.user?.email || 'Anonymous'}</Text>
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction(item._id, 'approved')}>
            <Ionicons name="checkmark-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(item._id, 'rejected')}>
            <Ionicons name="close-outline" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={dark ? ['#000000', '#1e293b'] : ['#1e3a5f', '#12263f']} style={styles.header}>
        <Text style={styles.headerTitle}>Feedback Hub</Text>
        <Text style={[styles.headerSub, { color: dark ? colors.textSecondary : 'rgba(255,255,255,0.7)' }]}>{feedback.length} submissions</Text>
      </LinearGradient>

      {/* Filter chips */}
      <View style={styles.filters}>
        {FILTER_OPTS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              statusFilter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => handleFilterChange(f)}
          >
            <Text style={[
              styles.filterChipText, 
              { color: colors.textSecondary },
              statusFilter === f && { color: '#fff', fontWeight: '800' }
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(f) => String(f._id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFeedback(); }} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={60} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No feedback to show</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 4 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 15, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 18, marginBottom: 16, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeText: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  message: { fontSize: 14, lineHeight: 22, marginBottom: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingNum: { fontSize: 12, marginLeft: 4, fontWeight: '600' },
  metaText: { fontSize: 12, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});
