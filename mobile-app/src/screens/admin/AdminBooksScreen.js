import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBooks, deleteBook } from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function AdminBooksScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [books, setBooks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchBooks = useCallback(async () => {
    try {
      const res = await getBooks();
      const data = res.data || [];
      setBooks(data);
      setFiltered(data);
    } catch (err) {
      console.error('Fetch Books Error:', err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(books); return; }
    const q = text.toLowerCase();
    setFiltered(books.filter((b) => 
      b.title?.toLowerCase().includes(q) || 
      b.author?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q)
    ));
  };

  const handleDeleteBook = (book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to remove "${book.title}" from the library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book._id);
              Alert.alert('Success', 'Book removed successfully');
              fetchBooks();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete book');
            }
          } 
        }
      ]
    );
  };

  const renderBook = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : colors.primary }]}>
      <View style={styles.cardContent}>
        <View style={[styles.coverContainer, { backgroundColor: dark ? colors.background : '#f1f5f9' }]}>
          {item.coverUrl ? (
            <Image 
              source={{ uri: item.coverUrl.startsWith('http') ? item.coverUrl : `${API_BASE_URL.replace(/\/api$/, '')}${item.coverUrl.startsWith('/') ? '' : '/'}${item.coverUrl}` }} 
              style={styles.cover} 
            />
          ) : (
            <View style={styles.noCover}>
              <Ionicons name="book" size={24} color={colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.author, { color: colors.textSecondary }]} numberOfLines={1}>by {item.author}</Text>
          <View style={[styles.badge, { backgroundColor: dark ? 'rgba(129, 140, 248, 0.1)' : '#f1f5f9' }]}>
            <Text style={[styles.badgeText, { color: dark ? colors.primary : '#64748b' }]}>{item.category || 'General'}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionIconBtn, { backgroundColor: dark ? 'rgba(59, 130, 246, 0.1)' : '#f8fafc' }]} 
            onPress={() => navigation.navigate('EditBook', { book: item })}
          >
            <Ionicons name="create-outline" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionIconBtn, { backgroundColor: dark ? 'rgba(239, 68, 68, 0.1)' : '#f8fafc' }]} 
            onPress={() => handleDeleteBook(item)}
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Syncing library...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={dark ? ['#000000', '#1e293b'] : ['#1e3a5f', '#12263f']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Library Catalog</Text>
            <Text style={[styles.headerSub, { color: dark ? colors.textSecondary : '#94a3b8' }]}>{books.length} books available</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddBook')}>
            <Ionicons name="add-circle" size={44} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)' }]}>
          <Ionicons name="search" size={20} color={dark ? colors.textSecondary : "#94a3b8"} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: '#fff' }]}
            placeholder="Search catalog..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={filtered}
        keyExtractor={(b) => String(b._id)}
        renderItem={renderBook}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => { setRefreshing(true); fetchBooks(); }} 
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="library-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Empty Catalog</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>No books found matching your search</Text>
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
  addBtn: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
  listContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 12, marginBottom: 12, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  coverContainer: { width: 50, height: 70, borderRadius: 8, overflow: 'hidden', marginRight: 12 },
  cover: { width: '100%', height: '100%' },
  noCover: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: '800' },
  author: { fontSize: 12, marginTop: 1, fontWeight: '500' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 4 },
  actionIconBtn: { padding: 8, borderRadius: 10 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 6, fontWeight: '500', textAlign: 'center', paddingHorizontal: 40 },
});
