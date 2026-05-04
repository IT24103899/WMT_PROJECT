import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Image, Dimensions, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { searchBooks, getSearchHistory, saveSearchHistory, clearSearchHistory, getRecommendationsByIdea } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, Modal } from 'react-native';
const { width } = Dimensions.get('window');

// Voice Search Safety Guard (Native module removed for Expo Go stability)
const ExpoSpeechRecognitionModule = null;

const GENRES = [
  'All', 'Fiction', 'Fantasy', 'Mystery', 'Romance', 'Science', 
  'History', 'Thriller', 'Biography', 'Horror', 'Poetry'
];

const YEAR_RANGES = [
  { label: 'Newest', value: '2024' },
  { label: '2020s', value: '2020' },
  { label: '2010s', value: '2010' },
  { label: 'Classics', value: '1900' }
];

export default function SearchScreen({ navigation }) {
  const { colors, dark } = useTheme();
  const { user, refreshUser } = useAuth();

  // Refresh premium status on focus
  useFocusEffect(
    React.useCallback(() => {
      if (refreshUser) refreshUser().catch(e => console.log('Refresh failed', e));
    }, [refreshUser])
  );

  const isPremium = user?.isPremium || 
                    user?.role === 'admin' || 
                    String(user?.plan).toUpperCase() === 'PREMIER' ||
                    String(user?.subscriptionPlan).toUpperCase() === 'PREMIER';
  
  // Search States
  const [query, setQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [isbnFilter, setIsbnFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // UI States
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'advanced'
  const [showFilters, setShowFilters] = useState(false);
  const [aiIdea, setAiIdea] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const searchInputRef = useRef(null);

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

  const loadHistory = useCallback(async () => {
    try {
      const res = await getSearchHistory();
      if (res.data) setHistory(res.data);
    } catch (_) {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleManualSearch = async (q = query) => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = { type: searchType, sort: sortBy };
      if (authorFilter.trim()) params.author = authorFilter.trim();
      if (genreFilter.trim()) params.category = genreFilter.trim();
      if (isbnFilter.trim()) params.isbn = isbnFilter.trim();
      if (yearFilter.trim()) params.year = yearFilter.trim();
      
      const res = await searchBooks(term, params);
      setResults(Array.isArray(res.data) ? res.data : []);
      await saveSearchHistory(term);
      await loadHistory();
    } catch (_) {
      Alert.alert('Connection Issue', 'Could not reach the library server. Check your internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiSearch = async (val = aiIdea) => {
    const idea = val.trim();
    if (!idea) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await getRecommendationsByIdea(idea);
      const suggestions = Array.isArray(res.data) ? res.data : (res.data.recommendations || []);
      setResults(suggestions);
      
      if (suggestions.length > 0) {
        await saveSearchHistory(idea);
        setAiIdea(''); 
        await loadHistory();
      }
    } catch (_) {
      Alert.alert('AI Offline', 'The AI engine is taking a break. Please try manual search or try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const renderResult = ({ item }) => (
    <TouchableOpacity
      style={[styles.resultCard, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#4f46e5' }]}
      onPress={() => navigation.navigate('BookDetail', { bookId: item._id, book: item })}
    >
      <View style={styles.resultCover}>
        {item.coverUrl
          ? <Image source={{ uri: item.coverUrl }} style={styles.coverImg} resizeMode="cover" />
          : <View style={[styles.coverPlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="book" size={24} color={colors.primary} />
            </View>
        }
      </View>
      <View style={styles.resultInfo}>
        <Text style={[styles.resultTitle, { color: colors.text }]} numberOfLines={2}>{item.title || 'Untitled'}</Text>
        <Text style={[styles.resultAuthor, { color: colors.textSecondary }]}>{item.author || 'Unknown Author'}</Text>
        <View style={styles.tagRow}>
          {item.category ? (
            <View style={[styles.categoryTag, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
            </View>
          ) : null}
          {item.rating ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ELITE HEADER */}
      <View style={[styles.header, { backgroundColor: dark ? colors.surface : colors.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.headerTitle}>Search Hub</Text>
          <TouchableOpacity onPress={() => { setHasSearched(false); loadHistory(); }}>
            <Ionicons name="time-outline" size={22} color="#fff" style={{ opacity: 0.8 }} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.qrBtn} onPress={() => navigation.navigate('QRScanner')}>
          <Ionicons name="qr-code-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODE SWITCHER */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ai' && { borderBottomColor: colors.primary }]} 
          onPress={() => setActiveTab('ai')}
        >
          <Ionicons name="sparkles" size={16} color={activeTab === 'ai' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'ai' ? colors.primary : colors.textSecondary }]}>Smart AI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'advanced' && { borderBottomColor: colors.primary }]} 
          onPress={() => setActiveTab('advanced')}
        >
          <Ionicons name="options" size={16} color={activeTab === 'advanced' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'advanced' ? colors.primary : colors.textSecondary }]}>Advanced</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* INPUT SECTION */}
        <View style={styles.inputSection}>
          {activeTab === 'ai' ? (
            <View style={[styles.aiBox, { backgroundColor: colors.surface, borderColor: dark ? colors.primary + '40' : '#e0e7ff' }]}>
              <Text style={[styles.aiHint, { color: colors.textSecondary }]}>Describe your ideal book...</Text>
              <TextInput
                style={[styles.aiInput, { color: colors.text, backgroundColor: dark ? colors.background : '#f8fafc' }]}
                placeholder="e.g. A fast-paced mystery set in Tokyo with a female detective"
                placeholderTextColor={colors.textSecondary + '80'}
                value={aiIdea}
                onChangeText={setAiIdea}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity style={[styles.aiButton, { backgroundColor: colors.primary }]} onPress={() => handleAiSearch()}>
                <Ionicons name="sparkles" size={18} color="#fff" />
                <Text style={styles.aiButtonText}>Find Magic</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.advancedBox, { backgroundColor: colors.surface }]}>
              <View style={[styles.searchRow, { backgroundColor: dark ? colors.background : '#f1f5f9' }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
                <TextInput
                  ref={searchInputRef}
                  style={[styles.manualInput, { color: colors.text }]}
                  placeholder="Title, Author, or ISBN..."
                  placeholderTextColor={colors.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => handleManualSearch()}
                />
                <TouchableOpacity onPress={startVoiceSearch} style={styles.voiceBtn}>
                  <Ionicons name="mic" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
                  <Ionicons name={showFilters ? "chevron-up-circle" : "add-circle-outline"} size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {showFilters && (
                <View style={styles.filterPanel}>
                  {!isPremium ? (
                    <View style={[styles.premiumLocked, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                      <MaterialCommunityIcons name="crown" size={32} color={colors.primary} />
                      <Text style={[styles.premiumTitle, { color: colors.text }]}>Premium Feature</Text>
                      <Text style={[styles.premiumSub, { color: colors.textSecondary }]}>Advanced filters are reserved for our Elite members.</Text>
                      <TouchableOpacity 
                        style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Profile', { screen: 'Payment' })}
                      >
                        <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      {/* Author Section */}
                      <View style={styles.filterGroup}>
                        <View style={styles.labelRow}>
                          <Ionicons name="person-outline" size={14} color={colors.primary} />
                          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Author</Text>
                        </View>
                        <View style={styles.inputWrapper}>
                          <TextInput 
                            style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: dark ? colors.background : '#fff' }]} 
                            placeholder="Search by author name..." 
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={authorFilter}
                            onChangeText={setAuthorFilter}
                          />
                          {authorFilter.length > 0 && (
                            <TouchableOpacity style={styles.clearBtn} onPress={() => setAuthorFilter('')}>
                              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Genre Section with Chips */}
                      <View style={styles.filterGroup}>
                        <View style={styles.labelRow}>
                          <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
                          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Select Genre</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                          {GENRES.map(g => (
                            <TouchableOpacity 
                              key={g} 
                              style={[
                                styles.genreChip, 
                                { backgroundColor: (genreFilter === g || (g === 'All' && !genreFilter)) ? colors.primary : colors.surface, 
                                  borderColor: colors.border }
                              ]}
                              onPress={() => setGenreFilter(g === 'All' ? '' : g)}
                            >
                              <Text style={[styles.genreChipText, { color: (genreFilter === g || (g === 'All' && !genreFilter)) ? '#fff' : colors.textSecondary }]}>
                                {g}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.filterRow}>
                        <View style={[styles.filterGroup, { flex: 1.2 }]}>
                          <View style={styles.labelRow}>
                            <Ionicons name="barcode-outline" size={14} color={colors.primary} />
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>ISBN</Text>
                          </View>
                          <View style={styles.inputWrapper}>
                            <TextInput 
                              style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: dark ? colors.background : '#fff' }]} 
                              placeholder="ISBN-13" 
                              placeholderTextColor={colors.textSecondary + '60'}
                              value={isbnFilter}
                              onChangeText={setIsbnFilter}
                              keyboardType="numeric"
                            />
                            <TouchableOpacity style={styles.clearBtn} onPress={() => navigation.navigate('QRScanner')}>
                              <Ionicons name="scan-outline" size={20} color={colors.primary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={[styles.filterGroup, { flex: 0.8 }]}>
                          <View style={styles.labelRow}>
                            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Year</Text>
                          </View>
                          <TextInput 
                            style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: dark ? colors.background : '#fff' }]} 
                            placeholder="YYYY" 
                            placeholderTextColor={colors.textSecondary + '60'}
                            value={yearFilter}
                            onChangeText={setYearFilter}
                            keyboardType="numeric"
                            maxLength={4}
                          />
                        </View>
                      </View>

                      {/* Year Presets */}
                      <View style={styles.filterGroup}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                          {YEAR_RANGES.map(yr => (
                            <TouchableOpacity 
                              key={yr.value} 
                              style={[
                                styles.yearChip, 
                                { backgroundColor: yearFilter === yr.value ? colors.primary : colors.surface, 
                                  borderColor: colors.border }
                              ]}
                              onPress={() => setYearFilter(yr.value)}
                            >
                              <Text style={[styles.yearChipText, { color: yearFilter === yr.value ? '#fff' : colors.textSecondary }]}>
                                {yr.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles.filterGroup}>
                        <View style={styles.labelRow}>
                          <Ionicons name="swap-vertical-outline" size={14} color={colors.primary} />
                          <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sort Results By</Text>
                        </View>
                        <View style={styles.sortOptions}>
                          {[
                            { id: 'relevance', icon: 'flash' },
                            { id: 'title', icon: 'text' },
                            { id: 'year', icon: 'calendar' },
                            { id: 'oldest', icon: 'history' }
                          ].map(opt => (
                            <TouchableOpacity 
                              key={opt.id}
                              style={[
                                styles.sortBtn, 
                                sortBy === opt.id && { backgroundColor: colors.primary, borderColor: colors.primary }
                              ]}
                              onPress={() => setSortBy(opt.id)}
                            >
                              <MaterialCommunityIcons 
                                name={opt.icon} 
                                size={14} 
                                color={sortBy === opt.id ? '#fff' : colors.textSecondary} 
                                style={{ marginRight: 4 }}
                              />
                              <Text style={[styles.sortBtnText, { color: sortBy === opt.id ? '#fff' : colors.textSecondary }]}>
                                {opt.id.charAt(0).toUpperCase() + opt.id.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={() => handleManualSearch()}>
                        <Ionicons name="search" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.applyBtnText}>Search with Filters</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* RESULTS SECTION */}
        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
          ) : hasSearched ? (
            <View>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                  {results.length} suggestions found
                </Text>
              </View>
              {results.length > 0 ? (
                results.map(item => <View key={item._id}>{renderResult({ item })}</View>)
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="book-search" size={64} color={colors.border} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Matches Found</Text>
                  <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try adjusting your keywords or switching to Smart AI mode.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.historySection}>
              {history.length > 0 ? (
                <View>
                  <View style={styles.historyHeader}>
                    <Text style={[styles.historyTitle, { color: colors.text }]}>Recent Activity</Text>
                    <TouchableOpacity onPress={async () => { await clearSearchHistory(); setHistory([]); }}>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.historyGrid}>
                    {history.slice(0, 10).map((h, i) => {
                      const termValue = typeof h === 'string' ? h : (h.term || h.searchQuery || '');
                      if (!termValue) return null;
                      
                      return (
                        <TouchableOpacity 
                          key={i} 
                          style={[styles.historyChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                          onPress={() => {
                            setAiIdea(termValue);
                            setActiveTab('ai');
                            // Removed automatic search to allow user to edit the text as requested
                          }}
                        >
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.chipText, { color: colors.textSecondary }]} numberOfLines={1}>{termValue}</Text>
                          <TouchableOpacity 
                            style={{ marginLeft: 4, padding: 2 }}
                            onPress={(e) => {
                              e.stopPropagation();
                              setQuery(termValue);
                              searchInputRef.current?.focus();
                            }}
                          >
                            <Ionicons name="arrow-up-outline" size={12} color={colors.primary} style={{ transform: [{ rotate: '45deg' }] }} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={styles.noHistory}>
                  <Ionicons name="search-outline" size={40} color={colors.border} />
                  <Text style={[styles.noHistoryText, { color: colors.textSecondary }]}>No recent searches</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* VOICE SEARCH MODAL */}
      <Modal visible={isListening} transparent animationType="fade">
        <View style={styles.voiceOverlay}>
          <View style={[styles.voiceCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.voiceTitle, { color: colors.text }]}>Listening...</Text>
            <Text style={[styles.voiceSub, { color: colors.textSecondary }]}>Tell me the book title or author</Text>
            
            <View style={styles.pulseContainer}>
              <Animated.View style={[styles.pulseCircle, { 
                backgroundColor: colors.primary + '20',
                transform: [{ scale: pulseAnim }]
              }]} />
              <TouchableOpacity style={[styles.micBig, { backgroundColor: colors.primary }]} onPress={stopVoiceSearch}>
                <Ionicons name="mic" size={40} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.voiceQuery, { color: colors.primary }]}>{query || '...'}</Text>

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
  header: { padding: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  qrBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  tabBar: { flexDirection: 'row', height: 50, elevation: 4, shadowOpacity: 0.1 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputSection: { padding: 20 },
  aiBox: { padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: '#4f46e5', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  aiHint: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  aiInput: { borderRadius: 16, padding: 15, fontSize: 15, height: 100, textAlignVertical: 'top', marginBottom: 15 },
  aiButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10 },
  aiButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  advancedBox: { padding: 5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 18, gap: 12 },
  manualInput: { flex: 1, fontSize: 15, height: 50, fontWeight: '600' },
  filterPanel: { marginTop: 15, gap: 15 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginLeft: 4 },
  filterInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  applyBtn: { padding: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  genreScroll: { marginTop: 4 },
  genreChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginRight: 8 },
  genreChipText: { fontSize: 13, fontWeight: '700' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  clearBtn: { position: 'absolute', right: 12 },
  yearChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginRight: 8 },
  yearChipText: { fontSize: 11, fontWeight: '700' },
  resultsContainer: { paddingHorizontal: 20 },
  resultsHeader: { marginBottom: 15 },
  resultsCount: { fontSize: 13, fontWeight: '700' },
  resultCard: { flexDirection: 'row', padding: 12, borderRadius: 20, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  resultCover: { width: 65, height: 90, borderRadius: 12, overflow: 'hidden', marginRight: 15 },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  resultInfo: { flex: 1, justifyContent: 'center' },
  resultTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  resultAuthor: { fontSize: 12, marginBottom: 8 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryText: { fontSize: 10, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, fontWeight: '700' },
  center: { padding: 40, alignItems: 'center' },
  historySection: { marginTop: 10 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  historyTitle: { fontSize: 16, fontWeight: '800' },
  historyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  historyChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '600', maxWidth: 100 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, opacity: 0.8 },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 15 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
  premiumLocked: { padding: 25, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },
  premiumTitle: { fontSize: 18, fontWeight: '900', marginTop: 10 },
  premiumSub: { fontSize: 13, textAlign: 'center', marginTop: 5, marginBottom: 15 },
  upgradeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  noHistory: { alignItems: 'center', paddingVertical: 20, opacity: 0.5 },
  noHistoryText: { fontSize: 14, marginTop: 8, fontWeight: '600' },
  filterRow: { flexDirection: 'row', gap: 10 },
  sortOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  sortBtnText: { fontSize: 11, fontWeight: '700' },
  voiceBtn: { padding: 5, marginRight: 5 },
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
