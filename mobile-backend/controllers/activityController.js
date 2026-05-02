const Activity = require('../models/Activity');
const Book = require('../models/Book');

const resolveBookId = (id) => {
  if (id == null) return null;
  const n = Number(id);
  return isNaN(n) ? String(id) : n;
};

const updateActivity = async (req, res) => {
  try {
    // Handle case where user doesn't exist in database
    if (!req.user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    const { bookId: rawBookId, pageNumber, page } = req.body;
    const finalPage = pageNumber !== undefined ? pageNumber : page;
    const bookId = resolveBookId(rawBookId);
    
    if (!bookId || finalPage === undefined) {
      return res.status(400).json({ message: 'Book ID and page context required' });
    }

    // Consolidate: find any activity for this user and book
    let activity = await Activity.findOne({ user: req.user._id, bookId });

    if (activity) {
      activity.pageNumber = finalPage;
      activity.lastReadAt = Date.now();
      await activity.save();
    } else {
      activity = await Activity.create({
        user: req.user._id,
        bookId,
        pageNumber: finalPage
      });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    // Handle case where user doesn't exist in database
    if (!req.user) {
      console.log('❌ [getHistory] User not found in database');
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    console.log('📖 [getHistory] User ID:', req.user._id);
    const history = await Activity.find({ user: req.user._id }).sort('-lastReadAt');
    console.log('📊 [getHistory] Found records:', history.length);
    
    if (history.length === 0) {
      console.log('⚠️ [getHistory] No activity records found for user:', req.user._id);
      return res.json([]);
    }

    const bookIds = history.map(h => h.bookId);
    
    // Fetch all related books
    const books = await Book.find({
       $or: [
         { legacyId: { $in: bookIds.map(id => Number(id)).filter(id => !isNaN(id)) } },
         { _id: { $in: bookIds.filter(id => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) } }
       ]
    }).lean();
    
    console.log('📚 [getHistory] Found related books:', books.length);
    
    const enriched = history.map(act => {
        const actObj = act.toObject();
        const bookDetails = books.find(b => 
            String(b.legacyId) === String(act.bookId) || 
            String(b._id) === String(act.bookId)
        );
        
        return {
            ...actObj,
            title: bookDetails?.title || 'Unknown Book',
            author: bookDetails?.author || 'Unknown',
            coverUrl: bookDetails?.coverUrl || bookDetails?.coverImage || '',
            totalPages: bookDetails?.totalPages || actObj.totalPages || 0,
            book: bookDetails || null
        };
    });
    
    console.log('✅ [getHistory] Returning enriched data:', enriched.length, 'records');
    res.json(enriched);
  } catch (error) {
    console.error('❌ [getHistory] Error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getReadingStats = async (req, res) => {
  try {
    // Handle case where user doesn't exist in database
    if (!req.user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    const history = await Activity.find({ user: req.user._id });
    
    // Total distinct books the user has interacted with (using normalized IDs)
    const distinctBooksIds = history.map(h => String(resolveBookId(h.bookId)));
    const booksReadCount = new Set(distinctBooksIds).size;
    
    // Total pages read across all books
    let totalPagesRead = 0;
    history.forEach(h => { totalPagesRead += (h.pageNumber || 0); });

    // --- REAl STREAK CALCULATION ---
    // Get unique dates (normalized to YYYY-MM-DD)
    const readingDates = [...new Set(history.map(h => h.lastReadAt.toISOString().split('T')[0]))].sort().reverse();
    
    let streak = 0;
    if (readingDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // Start counting if they read today or yesterday
      if (readingDates[0] === today || readingDates[0] === yesterday) {
        streak = 1;
        for (let i = 0; i < readingDates.length - 1; i++) {
          const d1 = new Date(readingDates[i]);
          const d2 = new Date(readingDates[i + 1]);
          const diff = (d1 - d2) / (1000 * 60 * 60 * 24);
          if (diff === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // --- REAL VELOCITY CALCULATION ---
    // Pages / days active (mocked as 7 for a weekly average)
    const velocity = totalPagesRead > 0 ? Math.round(totalPagesRead / 7) : 0;

    res.json({
      velocity,
      streak,
      booksRead: booksReadCount,
      pagesRead: totalPagesRead
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

const getReadingProgress = async (req, res) => {
  try {
    // Handle case where user doesn't exist in database
    if (!req.user) {
      return res.status(401).json({ message: 'User not found. Please log in again.' });
    }

    const { bookId } = req.params;
    const activity = await Activity.findOne({ user: req.user._id, bookId });
    if (!activity) return res.json({ pageNumber: 0 });
    res.json({ pageNumber: activity.pageNumber || 0 });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching progress' });
  }
};

module.exports = { updateActivity, getHistory, getReadingStats, getReadingProgress };
