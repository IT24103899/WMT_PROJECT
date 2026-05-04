import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getAllUsers, updateUserRole, deleteUser } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const ROLE_COLORS = { admin: '#ef4444', user: '#10b981' };

export default function AdminUsersScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const res = await getAllUsers();
      const data = res.data || [];
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      console.error('Fetch Users Error:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(users); return; }
    const q = text.toLowerCase();
    setFiltered(users.filter((u) => 
      u.name?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    ));
  };

  const handleChangeRole = (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Change Role',
      `Are you sure you want to change ${user.name}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              await updateUserRole(user._id, newRole);
              Alert.alert('Success', 'Role updated successfully');
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
            }
          } 
        }
      ]
    );
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user._id);
              Alert.alert('Success', 'User deleted successfully');
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete user');
            }
          } 
        }
      ]
    );
  };

  const renderUser = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : colors.primary }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: (ROLE_COLORS[item.role] || colors.textSecondary) + '15' }]}>
          <Text style={[styles.avatarText, { color: ROLE_COLORS[item.role] || colors.textSecondary }]}>
            {(item.name || '?')[0].toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name || 'Unknown User'}</Text>
            <View style={[styles.badge, { backgroundColor: (ROLE_COLORS[item.role] || colors.textSecondary) + '15' }]}>
              <Text style={[styles.badgeText, { color: ROLE_COLORS[item.role] || colors.textSecondary }]}>
                {(item.role || 'user').toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>{item.email}</Text>
        </View>

        <View style={styles.sideActions}>
          <TouchableOpacity 
            style={[styles.miniActionBtn, { backgroundColor: dark ? 'rgba(59, 130, 246, 0.15)' : '#3b82f610' }]} 
            onPress={() => handleChangeRole(item)}
          >
            <Ionicons name="shield-outline" size={18} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.miniActionBtn, { backgroundColor: dark ? 'rgba(239, 68, 68, 0.15)' : '#ef444410' }]} 
            onPress={() => handleDeleteUser(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Syncing accounts...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={dark ? ['#000000', '#1e293b'] : ['#1e3a5f', '#12263f']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={[styles.headerSub, { color: dark ? colors.textSecondary : '#94a3b8' }]}>{users.length} registered members</Text>
          </View>
          <View style={styles.headerIconContainer}>
            <Ionicons name="people" size={32} color="rgba(255,255,255,0.2)" />
          </View>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
          <Ionicons name="search" size={20} color={dark ? colors.textSecondary : "#94a3b8"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: '#fff' }]}
            placeholder="Search members..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(u) => String(u._id)}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchUsers(); }} 
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Members Found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>We couldn't find any users matching your search</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: '500' },
  headerGradient: { paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '500' },
  headerIconContainer: { padding: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 12, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontWeight: '800', fontSize: 20 },
  userInfo: { flex: 1, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  name: { fontSize: 16, fontWeight: '800', flexShrink: 1 },
  email: { fontSize: 13, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  sideActions: { flexDirection: 'row', gap: 8, paddingLeft: 8 },
  miniActionBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 6, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
});
