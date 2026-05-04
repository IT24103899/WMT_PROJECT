import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Modal, TextInput, ScrollView, Dimensions, StatusBar
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { saveReadingProgress, getReadingProgress, logReadingVelocity, getReadingVelocityStats, getBookmarks, addBookmark, deleteBookmark } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';


const { width } = Dimensions.get('window');

export default function ReaderScreen({ route, navigation }) {
  const { bookId, bookTitle, pdfUrl, totalPages: paramTotalPages } = route.params;
  const { user } = useAuth();
  const { colors, dark } = useTheme();


  console.log('📖 [Reader] bookId:', bookId, '| pdfUrl:', pdfUrl);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(paramTotalPages || 0);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [autoSpeed, setAutoSpeed] = useState(10);
  const [countdown, setCountdown] = useState(10);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [jumpPage, setJumpPage] = useState('');
  const [showJump, setShowJump] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [readingStats, setReadingStats] = useState(null);
  const [readerTheme, setReaderTheme] = useState('dark'); // 'white', 'sepia', 'dark'

  
  const startTimeRef = useRef(Date.now());
  const initialPageRef = useRef(1);

  const webviewRef = useRef(null);
  const autoRef = useRef(null);
  const countRef = useRef(null);

  // Immersive Mode: Hide bottom tabs & top header
  useEffect(() => {
    navigation.setOptions({
      headerShown: false // Remove the duplicate header
    });
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  // Load saved progress on mount
  useEffect(() => {
    if (user?._id && bookId) {
      getReadingProgress(bookId).then((res) => {
        if (res.data?.pageNumber) {
          setCurrentPage(res.data.pageNumber);
          initialPageRef.current = res.data.pageNumber;
          // Small delay to ensure WebView is ready
          setTimeout(() => sendToWebView(`goToPage(${res.data.pageNumber})`), 500);
        }
      }).catch(() => {});
      
      // Fetch bookmarks
      getBookmarks(bookId).then(res => {
        if (res.data) setBookmarks(res.data);
      }).catch(() => {});
      
      // Also fetch historical velocity stats
      getReadingVelocityStats(user._id, bookId)
        .then(res => { if (res.data?.status === 'success') setReadingStats(res.data.data); })
        .catch(() => {});
    }
  }, [bookId, user]);

  // Auto-save progress when page changes
  useEffect(() => {
    if (!user?._id || !bookId || totalPages === 0) return;
    const t = setTimeout(() => {
      saveReadingProgress(bookId, currentPage, totalPages).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [currentPage, bookId, totalPages, user]);

  // Auto-advance countdown
  useEffect(() => {
    if (autoAdvance) {
      setCountdown(autoSpeed);
      countRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { return autoSpeed; }
          return c - 1;
        });
      }, 1000);
      autoRef.current = setInterval(() => {
        setCurrentPage((p) => {
          if (p < totalPages) {
            sendToWebView(`goToPage(${p + 1})`);
            return p + 1;
          }
          return p;
        });
      }, autoSpeed * 1000);
    } else {
      clearInterval(autoRef.current);
      clearInterval(countRef.current);
    }
    return () => { clearInterval(autoRef.current); clearInterval(countRef.current); };
  }, [autoAdvance, autoSpeed, totalPages]);

  const sendToWebView = (js) => {
    webviewRef.current?.injectJavaScript(`${js}; true;`);
  };

  const goNext = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      sendToWebView(`goToPage(${next})`);
    }
  };

  const goPrev = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      sendToWebView(`goToPage(${prev})`);
    }
  };

  const zoomIn = () => {
    const nz = Math.min(zoom + 0.25, 3.0);
    setZoom(nz);
    sendToWebView(`setZoom(${nz})`);
  };

  const zoomOut = () => {
    const nz = Math.max(zoom - 0.25, 0.5);
    setZoom(nz);
    sendToWebView(`setZoom(${nz})`);
  };

  const handleAddBookmark = async () => {
    try {
      if (bookmarks.some(b => b.pageNumber === currentPage)) {
        Alert.alert('Notice', `Page ${currentPage} is already bookmarked.`);
        return;
      }
      const res = await addBookmark(bookId, currentPage);
      setBookmarks([...bookmarks, res.data].sort((a, b) => a.pageNumber - b.pageNumber));
      Alert.alert('Success', `Page ${currentPage} bookmarked!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to save bookmark');
    }
  };

  const handleDeleteBookmark = async (id) => {
    try {
      await deleteBookmark(id);
      setBookmarks(bookmarks.filter(b => b._id !== id));
    } catch (err) {
      Alert.alert('Error', 'Failed to delete bookmark');
    }
  };

  const jumpToPage = () => {
    const p = parseInt(jumpPage, 10);
    if (isNaN(p) || p < 1 || p > totalPages) {
      Alert.alert('Invalid Page', `Enter a page between 1 and ${totalPages}`);
      return;
    }
    setCurrentPage(p);
    sendToWebView(`goToPage(${p})`);
    setShowJump(false);
    setJumpPage('');
  };

  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'pageChange') setCurrentPage(data.page);
      if (data.type === 'totalPages') { setTotalPages(data.total); setLoading(false); }
    } catch (_) {}
  }, []);

  const getThemeColors = () => {
    if (readerTheme === 'white') return { bg: '#ffffff', text: '#1e293b', ui: '#f8fafc' };
    if (readerTheme === 'sepia') return { bg: '#f4ecd8', text: '#5b4636', ui: '#ede0c4' };
    return { bg: '#0f172a', text: '#f8fafc', ui: '#1e293b' };
  };

  const tColors = getThemeColors();


  const progressPct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const isBookmarked = bookmarks.some(b => b.pageNumber === currentPage);

  const proxyUrl = bookId ? `${API_BASE_URL}books/${bookId}/pdf-proxy` : pdfUrl;

  const singlePageHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body { margin: 0; background: ${tColors.bg}; display: flex; justify-content: center; align-items: flex-start; height: 100vh; overflow: hidden; transition: background 0.5s ease; }
    #container { width: 100%; height: 100%; overflow: auto; display: flex; justify-content: center; padding: 15px 0; }
    canvas { box-shadow: 0 10px 30px rgba(0,0,0,0.3); background: white; max-width: 92%; border-radius: 4px; }
  </style>
</head>
<body>
  <div id="container"><canvas id="pdfCanvas"></canvas></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    let pdfDoc = null, pageNum = ${currentPage}, scale = 2.5; // INCREASED SCALE FOR HD
    const canvas = document.getElementById('pdfCanvas');
    const ctx = canvas.getContext('2d');

    function renderPage(num) {
      if (!pdfDoc) return;
      pdfDoc.getPage(num).then(page => {
        const viewport = page.getViewport({ scale: scale * (window.innerWidth / 700) });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        const renderContext = { canvasContext: ctx, viewport: viewport };
        page.render(renderContext).promise.then(() => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'pageChange', page: num }));
        });
      });
    }

    function goToPage(n) { 
      if (pdfDoc && n >= 1 && n <= pdfDoc.numPages) { 
        pageNum = n; 
        renderPage(n); 
      } 
    }

    function setZoom(s) { scale = s * 2.0; renderPage(pageNum); }

    pdfjsLib.getDocument({ url: '${proxyUrl}' }).promise.then(doc => {
      pdfDoc = doc;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'totalPages', total: doc.numPages }));
      renderPage(pageNum);
    }).catch(e => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
      document.body.innerHTML = '<p style="color:white;padding:20px;text-align:center;">Failed to load: ' + e.message + '</p>';
    });
  </script>
</body>
</html>`;

  const [showRuler, setShowRuler] = useState(false);
  const [rulerPos, setRulerPos] = useState(250);

  return (
    <View style={[styles.container, { backgroundColor: tColors.bg }]}>
      <StatusBar hidden={!showControls} barStyle={readerTheme === 'white' ? 'dark-content' : 'light-content'} />

      {/* Top bar (Glassmorphism) */}
      {showControls && (
        <View style={[styles.topBar, { backgroundColor: readerTheme === 'white' ? 'rgba(255,255,255,0.9)' : 'rgba(30,41,59,0.85)' }]}>
          <TouchableOpacity 
            style={[styles.premiumExitBtn, { borderColor: tColors.text + '40' }]} 
            onPress={async () => {
              try {
                if (bookId && currentPage > 0) {
                  await saveReadingProgress(bookId, currentPage, totalPages);
                  const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
                  const pagesRead = Math.max(0, Math.abs(currentPage - initialPageRef.current));
                  if (pagesRead > 0 || durationSeconds > 30) {
                    await logReadingVelocity(user._id, bookId, pagesRead, durationSeconds);
                  }
                }
              } catch (e) {}
              // Restore bottom tabs before leaving
              navigation.getParent()?.setOptions({
                tabBarStyle: { display: 'flex' }
              });
              // Force navigation back to Main Discover page
              navigation.navigate('Books', { 
                screen: 'BooksList'
              });
            }}
          >
            <Ionicons name="chevron-back" size={18} color={tColors.text} />
            <Text style={[styles.exitText, { color: tColors.text }]}>Save & Exit</Text>
          </TouchableOpacity>
          <View style={styles.titleInfo}>
            <Text style={[styles.bookTitle, { color: tColors.text }]} numberOfLines={1}>{bookTitle}</Text>
          </View>
          
          <View style={styles.themeRow}>
             <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#ffffff' }]} onPress={() => setReaderTheme('white')} />
             <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#f4ecd8' }]} onPress={() => setReaderTheme('sepia')} />
             <TouchableOpacity style={[styles.themeBtn, { backgroundColor: '#0f172a' }]} onPress={() => setReaderTheme('dark')} />
          </View>

          <TouchableOpacity onPress={() => {
            const newState = !showRuler;
            setShowRuler(newState);
            if (newState) setShowControls(false); 
          }}>
            <Ionicons name="pencil" size={22} color={showRuler ? colors.primary : tColors.text + '80'} />
          </TouchableOpacity>
        </View>
      )}

      {/* Progress bar (Vibrant Glow) */}
      <View style={[styles.progressBarBg, { backgroundColor: readerTheme === 'white' ? '#e2e8f0' : '#ffffff15' }]}>
        <View style={[styles.progressBarFill, { width: `${progressPct}%`, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 }]} />
      </View>

      {/* PDF Viewer */}
      <TouchableOpacity 
        activeOpacity={1} 
        style={{ flex: 1 }} 
        onPress={() => setShowControls(!showControls)}
      >
        <WebView
          ref={webviewRef}
          source={{ html: singlePageHtml }}
          style={[styles.webview, { backgroundColor: tColors.bg }]}
          onMessage={onMessage}
          javaScriptEnabled
          scrollEnabled={false}
          originWhitelist={['*']}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
        
        {/* Content Highlighter */}
        {showRuler && (
          <View 
            style={[styles.focusRuler, { top: rulerPos, backgroundColor: readerTheme === 'sepia' ? 'rgba(91, 70, 54, 0.15)' : 'rgba(250, 204, 21, 0.2)' }]} 
            onStartShouldSetResponder={() => true}
            onResponderMove={(evt) => setRulerPos(evt.nativeEvent.pageY - 50)}
          >
            <View style={[styles.rulerHandle, { backgroundColor: readerTheme === 'sepia' ? '#5b4636' : '#facc15' }]} />
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Controls panel (Glassmorphism) */}
      {showControls && (
        <View style={[styles.controls, { backgroundColor: readerTheme === 'white' ? 'rgba(255,255,255,0.95)' : 'rgba(30,41,59,0.95)', borderTopColor: colors.border + '20' }]}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={goPrev} disabled={currentPage <= 1}>
              <Ionicons name="arrow-back-circle" size={42} color={currentPage <= 1 ? colors.border : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowJump(true)} style={styles.pageIndicator}>
              <Text style={[styles.pageText, { color: tColors.text }]}>{currentPage} / {totalPages}</Text>
              <Text style={[styles.pctText, { color: tColors.text + '70' }]}>{progressPct}% COMPLETE</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={goNext} disabled={currentPage >= totalPages}>
              <Ionicons name="arrow-forward-circle" size={42} color={currentPage >= totalPages ? colors.border : colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
             {/* Redesigned buttons with more spacing */}
            <TouchableOpacity style={styles.actionBtn} onPress={zoomOut}>
              <Ionicons name="remove-circle-outline" size={24} color={tColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={zoomIn}>
              <Ionicons name="add-circle-outline" size={24} color={tColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleAddBookmark}>
              <Ionicons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={24} color={isBookmarked ? colors.primary : tColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowBookmarks(true)}>
              <Ionicons name="list" size={24} color={tColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setAutoAdvance(!autoAdvance)}>
              <Ionicons name={autoAdvance ? 'pause' : 'play-outline'} size={24} color={autoAdvance ? colors.primary : tColors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Jump to page modal */}
      <Modal visible={showJump} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Jump to Page</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: dark ? colors.background : '#fff', color: colors.text, borderColor: colors.border }]}
              value={jumpPage}
              onChangeText={setJumpPage}
              keyboardType="numeric"
              placeholder={`1 – ${totalPages}`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setShowJump(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.primary }]} onPress={jumpToPage}>
                <Text style={styles.modalConfirmText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Bookmarks panel */}
      <Modal visible={showBookmarks} transparent animationType="slide">
        <View style={styles.bookmarksOverlay}>
          <View style={[styles.bookmarksPanel, { backgroundColor: colors.surface }]}>
            <View style={styles.bookmarkHeader}>
              <Text style={[styles.bookmarkTitle, { color: colors.text }]}>Bookmarks</Text>
              <TouchableOpacity onPress={() => setShowBookmarks(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            {bookmarks.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No bookmarks yet. Tap the bookmark icon while reading.</Text>
            ) : (
              <ScrollView>
                {bookmarks.map((b) => (
                  <View key={b._id} style={[styles.bookmarkItem, { borderColor: colors.border }]}>
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                      onPress={() => { setCurrentPage(b.pageNumber); sendToWebView(`goToPage(${b.pageNumber})`); setShowBookmarks(false); }}
                    >
                      <Ionicons name="bookmark" size={16} color={colors.primary} />
                      <Text style={[styles.bookmarkPageText, { color: colors.text }]}>Page {b.pageNumber}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteBookmark(b._id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

// eslint-disable-next-line no-unused-vars
function goToPage(n) {} // referenced in sendToWebView

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: 50, gap: 15, elevation: 5, shadowOpacity: 0.1, zIndex: 100 },
  premiumExitBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 4 },
  exitText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  titleInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 5 },
  bookTitle: { fontSize: 17, fontWeight: '900' },
  hdBadge: { backgroundColor: '#10b981', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  hdText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  themeRow: { flexDirection: 'row', gap: 8, marginRight: 15 },
  themeBtn: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  progressBarBg: { height: 5, width: '100%' },
  progressBarFill: { height: '100%' },
  webview: { flex: 1 },
  focusRuler: { position: 'absolute', left: 0, right: 0, height: 45, borderTopWidth: 2, borderBottomWidth: 2, borderColor: 'rgba(250, 204, 21, 0.4)', zIndex: 50 },
  rulerHandle: { position: 'absolute', right: 12, top: 12, width: 22, height: 22, borderRadius: 11, opacity: 0.6 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  controls: { borderTopWidth: 1, paddingBottom: 25, shadowOpacity: 0.2, shadowRadius: 15, elevation: 20 },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 45 },
  navBtn: { padding: 8 },
  pageIndicator: { alignItems: 'center' },
  pageText: { fontSize: 18, fontWeight: '900' },
  pctText: { fontSize: 10, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 10, paddingHorizontal: 20 },
  actionBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)' },
  actionBtnActive: { backgroundColor: '#e3f2fd' },
  actionLabel: { fontSize: 10, color: '#555', marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 260 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f', marginBottom: 14 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  modalCancelText: { color: '#555', fontWeight: '600' },
  modalConfirm: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  bookmarksOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bookmarksPanel: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%' },
  bookmarkHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bookmarkTitle: { fontSize: 16, fontWeight: '700', color: '#1e3a5f' },
  bookmarkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  bookmarkPageText: { fontSize: 14, color: '#333' },
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  fallbackLink: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center' },
  fallbackText: { color: '#ddd', fontSize: 12, textDecorationLine: 'underline' },
  statBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4fc3f7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 2 },
  statText: { color: '#fff', fontSize: 10, fontWeight: '700' }
});
