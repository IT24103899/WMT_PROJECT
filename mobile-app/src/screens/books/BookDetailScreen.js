import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { addToBookshelf } from '../../services/api';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function BookDetailScreen({ route, navigation }) {
  const { book } = route.params;
  const { user } = useAuth();
  const { colors, dark } = useTheme();
  const [adding, setAdding] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [customLists, setCustomLists] = useState([]);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');

  React.useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await api.get('bookshelf');
        const data = res.data || {};
        const defaults = ['reading', 'favourites', 'wishlist'];
        const custom = Object.keys(data).filter(k => !defaults.includes(k));
        setCustomLists(custom);
      } catch (_) {}
    };
    fetchLists();
  }, []);

  const handleAddToBookshelf = async (listType) => {
    const finalType = listType || newListName.trim().toLowerCase();
    if (!finalType) return;

    setAdding(true);
    setShowListPicker(false);
    setShowNewListInput(false);
    try {
      await addToBookshelf(book._id, finalType);
      Alert.alert('📖 Added!', `"${book.title}" added to your ${finalType}.`);
      // Update custom lists if it was a new one
      if (!['favourites', 'reading', 'wishlist', ...customLists].includes(finalType)) {
          setCustomLists([...customLists, finalType]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to bookshelf';
      Alert.alert('Notice', msg);
    } finally {
      setAdding(false);
      setNewListName('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Immersive Cover Section */}
        <View style={styles.coverWrapper}>
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.9)', 'transparent', 'rgba(15, 23, 42, 0.8)']}
            style={styles.coverOverlay}
          />
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.backgroundBlur} blurRadius={10} />
          ) : (
            <View style={[styles.backgroundBlur, { backgroundColor: '#1e293b' }]} />
          )}

          <View style={styles.coverContent}>
            <View style={styles.backButtonWrapper}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.glassBtn}>
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.bookImageShadow}>
              {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} style={styles.mainCover} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#4f46e5', '#a855f7']} style={styles.mainCoverPlaceholder}>
                  <Ionicons name="book" size={60} color="#fff" />
                </LinearGradient>
              )}
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <View style={styles.cardIndicator} />
          
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{book.title}</Text>
              <Text style={[styles.author, { color: colors.textSecondary }]}>by {book.author}</Text>
            </View>
            {book.category && (
              <View style={[styles.genreTag, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.genreTagText, { color: colors.primary }]}>{book.category}</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.descLabel, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]}>{book.description || 'Dive into this incredible story and explore new horizons.'}</Text>

          {/* Action Hub */}
          <View style={styles.actionHub}>
            <TouchableOpacity
              style={[styles.readBtn, { shadowColor: colors.primary }]}
              onPress={() => navigation.navigate('Reader', { 
                bookId: book._id, 
                bookTitle: book.title, 
                pdfUrl: book.pdfUrl,
                totalPages: book.totalPages || 0
              })}
            >
              <LinearGradient colors={['#4f46e5', '#6366f1']} style={styles.btnGradient} start={{x:0, y:0}} end={{x:1, y:0}}>
                <Ionicons name="book-outline" size={20} color="#fff" />
                <Text style={styles.readBtnText}>Start Reading</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bookshelfBtn, { borderColor: colors.primary }]}
              onPress={() => setShowListPicker(true)}
              disabled={adding}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.bookshelfBtnText, { color: colors.primary }]}>{adding ? 'Adding…' : 'Add to Collection'}</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Management */}
          {user?.role === 'admin' && (
            <View style={styles.adminSection}>
              <Text style={[styles.adminLabel, { color: colors.text }]}>Management Controls</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => navigation.navigate('EditBook', { book })}
              >
                <Ionicons name="options-outline" size={18} color="#fff" />
                <Text style={styles.editBtnText}>Modify Catalog Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* List picker modal */}
      {showListPicker && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Add to which list?</Text>
            
            <ScrollView style={{ maxHeight: 300 }}>
                {['reading', 'favourites', 'wishlist', ...customLists].map((list) => (
                <TouchableOpacity
                    key={list}
                    style={[styles.pickerOption, { borderColor: colors.border }]}
                    onPress={() => handleAddToBookshelf(list)}
                >
                    <Ionicons
                    name={list === 'favourites' ? 'heart' : list === 'reading' ? 'book' : list === 'wishlist' ? 'star' : 'folder'}
                    size={20} color={colors.primary}
                    />
                    <Text style={[styles.pickerOptionText, { color: colors.text }]}>{list.charAt(0).toUpperCase() + list.slice(1)}</Text>
                </TouchableOpacity>
                ))}

                <TouchableOpacity 
                    style={[styles.pickerOption, { borderColor: colors.border, borderStyle: 'dashed' }]}
                    onPress={() => setShowNewListInput(true)}
                >
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <Text style={[styles.pickerOptionText, { color: colors.primary }]}>Add to new list...</Text>
                </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowListPicker(false)}>
              <Text style={styles.pickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* New List Input Modal */}
      {showNewListInput && (
          <View style={styles.pickerOverlay}>
              <View style={[styles.pickerCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.pickerTitle, { color: colors.text }]}>New Wishlist Name</Text>
                  <TextInput 
                    style={[styles.newListInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="e.g. Summer Reading"
                    placeholderTextColor={colors.textSecondary}
                    value={newListName}
                    onChangeText={setNewListName}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[styles.modalBtn, { flex: 1, backgroundColor: colors.border }]} onPress={() => setShowNewListInput(false)}>
                        <Text style={{ fontWeight: '800', color: colors.text }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, { flex: 2, backgroundColor: colors.primary }]} onPress={() => handleAddToBookshelf()}>
                        <Text style={{ fontWeight: '900', color: '#fff' }}>Add Book</Text>
                    </TouchableOpacity>
                  </View>
              </View>
          </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  coverWrapper: { height: 420, width: '100%', position: 'relative', overflow: 'hidden' },
  coverOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  backgroundBlur: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.8 },
  coverContent: { flex: 1, zIndex: 2, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  backButtonWrapper: { position: 'absolute', top: 60, left: 20 },
  glassBtn: { width: 44, height: 44, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWeight: 1, borderColor: 'rgba(255,255,255,0.3)' },
  bookImageShadow: { shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 25, elevation: 20 },
  mainCover: { width: 170, height: 250, borderRadius: 18 },
  mainCoverPlaceholder: { width: 170, height: 250, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },

  infoCard: { 
    flex: 1, 
    marginTop: -40, 
    borderTopLeftRadius: 45, 
    borderTopRightRadius: 45, 
    padding: 30, 
    zIndex: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10
  },
  cardIndicator: { width: 40, height: 5, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 10, alignSelf: 'center', marginBottom: 25 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  author: { fontSize: 16, marginTop: 4, fontWeight: '600' },
  genreTag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  genreTagText: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  
  divider: { height: 1, marginVertical: 25 },
  descLabel: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  desc: { fontSize: 16, lineHeight: 26, fontWeight: '500' },

  actionHub: { marginTop: 40, gap: 15 },
  readBtn: { borderRadius: 20, overflow: 'hidden', elevation: 8, shadowOpacity: 0.3, shadowRadius: 15 },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  readBtnText: { color: '#fff', fontWeight: '900', fontSize: 17, letterSpacing: 0.5 },
  bookshelfBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 2, borderRadius: 20, paddingVertical: 16 },
  bookshelfBtnText: { fontWeight: '900', fontSize: 16 },

  adminSection: { marginTop: 40, padding: 20, backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  adminLabel: { fontSize: 15, fontWeight: '900', marginBottom: 15 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1e293b', borderRadius: 15, paddingVertical: 14 },
  editBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  pickerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 100 },
  pickerCard: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 35, paddingBottom: 50 },
  pickerTitle: { fontSize: 20, fontWeight: '900', marginBottom: 25, textAlign: 'center' },
  pickerOption: { flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 18, borderBottomWidth: 1 },
  pickerOptionText: { fontSize: 16, fontWeight: '800' },
  pickerCancel: { paddingVertical: 15, alignItems: 'center', marginTop: 15 },
  pickerCancelText: { color: '#ef4444', fontWeight: '900', fontSize: 16 },
  newListInput: { borderWidth: 1, borderRadius: 15, padding: 15, fontSize: 16, marginBottom: 20 },
  modalBtn: { paddingVertical: 15, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }
});
