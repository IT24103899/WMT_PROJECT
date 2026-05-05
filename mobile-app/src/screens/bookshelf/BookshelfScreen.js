import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, Image, RefreshControl, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBookshelf, removeFromBookshelf } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';


const DEFAULT_SHELVES = [
  { id: 'reading', label: 'Reading Now', color: '#12c2e9', icon: 'book' },
  { id: 'favourites', label: 'Favourites', color: '#f64f59', icon: 'heart' },
  { id: 'wishlist', label: 'Wishlist', color: '#c471ed', icon: 'star' }
];

export default function BookshelfScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [bookshelf, setBookshelf] = useState({});

  const [activeTab, setActiveTab] = useState('reading');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [dynamicShelves, setDynamicShelves] = useState(DEFAULT_SHELVES);

  const fetchData = useCallback(async () => {
    try {
      const res = await getBookshelf();
      const data = res.data || {};
      setBookshelf(data);
      
      // Generate dynamic shelves from data keys
      const customKeys = Object.keys(data).filter(key => !DEFAULT_SHELVES.some(s => s.id === key));
      const newShelves = [...DEFAULT_SHELVES];
      customKeys.forEach(key => {
        newShelves.push({
          id: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          color: '#8b5cf6', // Generic color for custom lists
          icon: 'folder'
        });
      });
      setDynamicShelves(newShelves);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleRemove = async (bookId, title) => {
    Alert.alert(
      "Remove Book",
      `Are you sure you want to remove "${title}" from your library?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await removeFromBookshelf(bookId);
              fetchData(); // Refresh list
            } catch (err) {
              Alert.alert("Error", "Could not remove the book. Try again.");
            }
          } 
        }
      ]
    );
  };

  const books = bookshelf[activeTab] || [];
  const activeColor = dynamicShelves.find(s => s.id === activeTab)?.color || '#333';

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const listId = newListName.trim().toLowerCase();
    if (dynamicShelves.some(s => s.id === listId)) {
        Alert.alert("Notice", "List already exists");
        return;
    }
    // Since we don't have a backend "list" collection, we just set the tab and let it be empty.
    // The next time we add a book, it will be permanent.
    setDynamicShelves([...dynamicShelves, {
        id: listId,
        label: newListName.trim(),
        color: '#8b5cf6',
        icon: 'folder'
    }]);
    setActiveTab(listId);
    setShowAddList(false);
    setNewListName('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient 
        colors={dark ? ['#0f172a', '#1e1b4b'] : [activeColor, activeColor + 'DD']} 
        start={{x: 0, y: 0}} end={{x: 1, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerDecoration} />
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerSub}>Managing your personal reading collection</Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContainer}>
        {dynamicShelves.map(shelf => (
          <TouchableOpacity
            key={shelf.id}
            style={[
              styles.tab, 
              { backgroundColor: colors.surface, borderColor: colors.border }, 
              activeTab === shelf.id && { backgroundColor: shelf.color, borderColor: shelf.color, elevation: 8 }
            ]}
            onPress={() => setActiveTab(shelf.id)}
          >
            <Ionicons name={shelf.icon} size={18} color={activeTab === shelf.id ? '#fff' : shelf.color} />
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === shelf.id && { color: '#fff' }]}>
              {shelf.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.tab, { backgroundColor: colors.surface, borderStyle: 'dashed', borderColor: colors.primary }]}
          onPress={() => setShowAddList(true)}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={[styles.tabText, { color: colors.primary }]}>New List</Text>
        </TouchableOpacity>
      </ScrollView>


        {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={activeColor} /></View>
        ) : (
            <FlatList 
                data={books}
                keyExtractor={(b, i) => String(b._id || i)}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
                renderItem={({item}) => (
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#475569' }]} 
                        activeOpacity={0.9} 
                        onPress={() => navigation.navigate('Books', { screen: 'BookDetail', params: { bookId: item.bookId?._id || item.bookId, book: item.bookId || {} } })}
                    >
                        {item.bookId?.coverUrl ? (
                            <Image source={{ uri: item.bookId.coverUrl }} style={styles.cover} />
                        ) : (
                            <View style={[styles.coverPlaceholder, { backgroundColor: colors.border }]}><Ionicons name="book" size={24} color={colors.textSecondary} /></View>
                        )}
                        <View style={styles.info}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.bookId?.title || 'Unknown Book'}</Text>
                                <TouchableOpacity 
                                    style={styles.deleteBtn}
                                    onPress={() => handleRemove(item.bookId?._id || item.bookId, item.bookId?.title)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.error || '#ff4444'} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.author, { color: colors.textSecondary }]}>{item.bookId?.author || 'Unknown'}</Text>
                            <View style={[styles.statusTag, { backgroundColor: activeColor + '20' }]}>
                                <Text style={[styles.statusText, { color: activeColor }]}>{item.status}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}

                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="folder-open" size={70} color={colors.border} />
                        <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>This shelf is totally empty!</Text>

                        <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: activeColor }]} onPress={() => navigation.navigate('Books')}>
                            <Text style={styles.exploreText}>Find Great Books</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        )}

        <AddListModal 
            visible={showAddList}
            onClose={() => setShowAddList(false)}
            onAdd={handleCreateList}
            value={newListName}
            onChange={setNewListName}
            colors={colors}
        />
    </View>
  );
}

import { Modal, TextInput } from 'react-native';

function AddListModal({ visible, onClose, onAdd, value, onChange, colors }) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Wishlist</Text>
                    <TextInput 
                        style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                        placeholder="e.g. My Favorites 2024"
                        placeholderTextColor={colors.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        autoFocus
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.primary }]} onPress={onAdd}>
                            <Text style={styles.modalConfirmText}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    paddingTop: 75, 
    paddingBottom: 60, 
    paddingHorizontal: 30, 
    borderBottomRightRadius: 45, 
    borderBottomLeftRadius: 45,
    position: 'relative',
    overflow: 'hidden',
  },
  headerDecoration: { position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)' },
  headerTitle: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 6, fontWeight: '600' },
  
  tabScroll: { marginTop: -32, maxHeight: 65 },
  tabContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 25, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 20, borderRadius: 20, borderWidth: 2, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
  tabText: { marginLeft: 8, fontSize: 13, fontWeight: '900' },
  
  list: { padding: 25, paddingBottom: 130, paddingTop: 20 },
  card: { flexDirection: 'row', padding: 20, borderRadius: 32, marginBottom: 18, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  cover: { width: 85, height: 125, borderRadius: 18, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  coverPlaceholder: { width: 85, height: 125, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 20, justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '900', letterSpacing: -0.5, flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  deleteBtn: { padding: 5, marginLeft: 10 },
  author: { fontSize: 14, fontWeight: '700', marginBottom: 12, opacity: 0.7 },
  statusTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginTop: 25, textAlign: 'center' },
  exploreBtn: { paddingHorizontal: 35, paddingVertical: 18, borderRadius: 24, marginTop: 30, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  exploreText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '80%', padding: 30, borderRadius: 30 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  modalInput: { borderWidth: 1, borderRadius: 15, padding: 15, fontSize: 16, marginBottom: 25 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  modalCancel: { padding: 10 },
  modalCancelText: { fontWeight: '800', color: '#ef4444' },
  modalConfirm: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 15 },
  modalConfirmText: { color: '#fff', fontWeight: '900' }
});
