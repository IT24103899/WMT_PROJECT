const Bookmark = require('../models/Bookmark');

// @desc    Add a bookmark
// @route   POST /api/bookmarks
exports.addBookmark = async (req, res) => {
  try {
    const { bookId, pageNumber, note } = req.body;
    if (!bookId || !pageNumber) {
      return res.status(400).json({ message: 'Book ID and page number are required' });
    }

    const bookmark = await Bookmark.create({
      user: req.user._id,
      bookId,
      pageNumber,
      note: note || ''
    });

    res.status(201).json(bookmark);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Page already bookmarked' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all bookmarks for a book
// @route   GET /api/bookmarks/:bookId
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ 
      user: req.user._id, 
      bookId: req.params.bookId 
    }).sort('pageNumber');
    
    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove a bookmark
// @route   DELETE /api/bookmarks/:id
exports.deleteBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    
    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    res.json({ message: 'Bookmark removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
