import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image, ScrollView, Alert,
  Animated, Modal, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBooks, addToBookshelf, getBookshelf } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';


const GENRES = [
  { name: 'All', color: '#FF416C' },
  { name: 'Technology', color: '#4A00E0' },
  { name: 'Fiction', color: '#00B4DB' },
  { name: 'Science', color: '#56ab2f' },
  { name: 'History', color: '#F2994A' },
  { name: 'Self-Help', color: '#9B59B6' },
  { name: 'Business', color: '#E67E22' }
];

export default function BooksScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Voice Search logic removed for Expo Go stability
  useEffect(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [isListening, pulseAnim]);

  const startVoiceSearch = () => {
    Alert.alert(
      'Search Guidance',
      'For the best experience, please use the microphone button on your keyboard. This ensures your search is accurate and fast!'
    );
  };

  const stopVoiceSearch = () => {
    setIsListening(false);
  };

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both catalog components
      const [booksRes, bookshelfRes] = await Promise.all([
        getBooks(),
        getBookshelf()
      ]);
      
      const allBooks = booksRes.data || [];
      const shelfData = bookshelfRes.data || {};
      
      // Combine all bookshelf IDs into a set for fast lookup
      const bookshelfIds = new Set([
        ...(shelfData.reading || []).map(i => i.bookId?._id || i.bookId),
        ...(shelfData.favourites || []).map(i => i.bookId?._id || i.bookId),
        ...(shelfData.wishlist || []).map(i => i.bookId?._id || i.bookId),
      ]);

      // Show all books from the database
      setBooks(allBooks);
    } catch (_) {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleBorrow = async (bookId, title) => {
    try {
      await addToBookshelf(bookId, 'reading');
      Alert.alert('📖 Borrowed!', `"${title}" has been added to your shelf.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to borrow';
      Alert.alert('Notice', msg);
    }
  };

  const filtered = books.filter((b) => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === 'All' || b.category === genre;
    return matchSearch && matchGenre;
  });

  const activeGenreColor = GENRES.find(g => g.name === genre)?.color || '#333';

  const renderBook = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.bookCardGrid, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#1e293b' }]}
      onPress={() => navigation.navigate('BookDetail', { bookId: item._id, book: item })}
      activeOpacity={0.9}
    >

      <View style={styles.cardContainer}>
        {/* Cover Image */}
        <View style={styles.imageWrapper}>
          {item.coverUrl ? (
            <Image 
              source={{ uri: item.coverUrl }} 
              style={styles.coverImgGrid}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient colors={dark ? ['#312e81', '#4338ca'] : ['#6366f1', '#a855f7']} style={styles.coverImgGrid}>
              <Ionicons name="book" size={40} color="#fff" />
            </LinearGradient>
          )}

          
          {/* Floating Genre Tag */}
          {item.category && (
            <View style={[styles.floatingTag, { backgroundColor: dark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
              <Text style={[styles.floatingTagText, { color: dark ? '#818cf8' : '#4f46e5' }]}>{item.category}</Text>
            </View>
          )}


          {/* Action Overlay */}
          <LinearGradient 
            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']} 
            style={styles.cardOverlay}
          />
        </View>

        {/* Content Section */}
        <View style={styles.cardInfoSection}>
          <Text style={[styles.bookTitleGrid, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.bookAuthorGrid, { color: colors.textSecondary }]} numberOfLines={1}>{item.author}</Text>

          
          <View style={styles.actionButtonRow}>
            <TouchableOpacity
              style={styles.readBtn}
              onPress={() => navigation.navigate('Reader', { 
                bookId: item._id, 
                bookTitle: item.title, 
                pdfUrl: item.pdfUrl,
                totalPages: item.totalPages || 0
              })}
            >
               <Ionicons name="book-outline" size={14} color="#fff" />
               <Text style={styles.miniActionText}>Read</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.miniActionBtn, { backgroundColor: colors.primary }]} 
               onPress={() => handleBorrow(item._id, item.title)}
            >
               <Ionicons name="add-circle-outline" size={14} color="#fff" />
               <Text style={styles.miniActionText}>Borrow</Text>
            </TouchableOpacity>

          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <LinearGradient 
        colors={['#0f172a', '#1e1b4b', '#312e81']} 
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.premiumHeader}
      >
        <View style={styles.headerDecoration} />
        
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSub}>Find your next great adventure</Text>
        
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
          <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search titles, authors..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={startVoiceSearch} style={{ marginRight: 10 }}>
            <Ionicons name="mic" size={22} color={isListening ? colors.primary : "#fff"} />
          </TouchableOpacity>
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>


      <View style={[styles.genreWrapper, { backgroundColor: colors.background }]}>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
          {GENRES.map(g => (
            <TouchableOpacity
              key={g.name}
              style={[styles.genreChip, { backgroundColor: colors.surface, borderColor: colors.border }, genre === g.name && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setGenre(g.name)}
            >
              <Text style={[styles.genreChipText, { color: colors.textSecondary }, genre === g.name && { color: '#fff' }]}>{g.name}</Text>
            </TouchableOpacity>
          ))}

        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (

        <FlatList
          data={filtered}
          keyExtractor={(b) => String(b._id)}
          renderItem={renderBook}
          numColumns={2}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBooks(); }} />}
          contentContainerStyle={styles.gridContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="planet" size={80} color={colors.border} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No books found</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary, opacity: 0.7 }]}>Try adjusting your search or genre.</Text>
            </View>

          }
        />
      )}

      {/* VOICE SEARCH MODAL */}
      <Modal visible={isListening} transparent animationType="fade">
        <View style={styles.voiceOverlay}>
          <View style={[styles.voiceCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.voiceTitle, { color: colors.text }]}>Listening...</Text>
            <Text style={[styles.voiceSub, { color: colors.textSecondary }]}>What book are you looking for?</Text>
            
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseCircle, { 
                backgroundColor: colors.primary + '20',
                transform: [{ scale: pulseAnim }]
              }]} />
              <TouchableOpacity style={[styles.micBig, { backgroundColor: colors.primary }]} onPress={stopVoiceSearch}>
                <Ionicons name="mic" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.voiceQuery, { color: colors.primary }]}>{search || '...'}</Text>

            <TouchableOpacity style={[styles.voiceCancel, { borderColor: colors.border }]} onPress={stopVoiceSearch}>
              <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  premiumHeader: { 
    paddingTop: 75, 
    paddingHorizontal: 25, 
    paddingBottom: 35,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
    overflow: 'hidden',
    elevation: 10,
  },
  headerDecoration: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerTitle: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  headerSub: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: '600' },
  searchBar: { flexDirection: 'row', marginTop: 25, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 20, alignItems: 'center' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#fff', fontWeight: '600' },
  
  genreWrapper: { paddingVertical: 20 },
  genreScroll: { paddingHorizontal: 25 },
  genreChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginRight: 12, borderWidth: 1.5 },
  genreChipText: { fontSize: 14, fontWeight: '800' },
  
  gridContent: { paddingHorizontal: 15, paddingBottom: 130 },
  bookCardGrid: { flex: 1, margin: 8, borderRadius: 32, elevation: 12, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { height: 10, width: 0 } },
  cardContainer: { borderRadius: 32, overflow: 'hidden' },
  imageWrapper: { height: 220, width: '100%', position: 'relative' },
  coverImgGrid: { width: '100%', height: '100%' },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  floatingTag: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, zIndex: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  floatingTagText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  cardInfoSection: { padding: 16 },
  bookTitleGrid: { fontSize: 16, fontWeight: '900', marginBottom: 4, letterSpacing: -0.4 },
  bookAuthorGrid: { fontSize: 13, fontWeight: '600', marginBottom: 15, opacity: 0.7 },
  actionButtonRow: { flexDirection: 'row', gap: 8 },
  miniActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, elevation: 4 },
  readBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: '#059669', elevation: 4 },
  miniActionText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginTop: 25, textAlign: 'center' },
  emptySub: { fontSize: 16, marginTop: 10, textAlign: 'center', opacity: 0.6, lineHeight: 24 },

  // Voice Search Styles
  voiceOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  voiceCard: { width: '85%', padding: 40, borderRadius: 32, alignItems: 'center', gap: 20 },
  voiceTitle: { fontSize: 24, fontWeight: '900' },
  voiceSub: { fontSize: 15, textAlign: 'center' },
  pulseContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  pulseCircle: { position: 'absolute', width: 100, height: 100, borderRadius: 50 },
  micBig: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowOpacity: 0.3, shadowRadius: 10 },
  voiceQuery: { fontSize: 18, fontWeight: '700', textAlign: 'center', fontStyle: 'italic' },
  voiceCancel: { marginTop: 20, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 16, borderWidth: 1 }
});
