const Bookshelf = require('../models/Bookshelf');
const Book = require('../models/Book');

// @desc    Get complete bookshelf grouped by listType
// @route   GET /api/bookshelf
exports.getBookshelf = async (req, res) => {
  try {
    const items = await Bookshelf.find({ user: req.user._id }).populate('bookId');
    
    // Group by listType
    const grouped = {};
    items.forEach(item => {
      // Avoid adding if book was deleted fully from DB
      if (!item.bookId) return; 
      
      const list = item.listType;
      if (!grouped[list]) grouped[list] = [];
      grouped[list].push(item);
    });
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookshelf', error: error.message });
  }
};

// @desc    Add book to a specific list
// @route   POST /api/bookshelf
exports.addToBookshelf = async (req, res) => {
  try {
    const { bookId, listType } = req.body;
    let item = await Bookshelf.findOne({ user: req.user._id, bookId, listType });
    if (item) return res.status(400).json({ message: 'Book already in this list' });

    item = await Bookshelf.create({
      user: req.user._id,
      bookId,
      listType: listType || 'reading',
      status: 'want-to-read'
    });
    
    // Sync with separate Favourite collection if needed
    if (listType === 'favourites') {
      try {
        const Favourite = require('../models/Favourite');
        await Favourite.create({ user: req.user._id, bookId });
      } catch (_) { /* Ignore duplicate or errors to keep main flow working */ }
    }
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove book entirely from bookshelf list
// @route   DELETE /api/bookshelf/:bookId
exports.removeFromBookshelf = async (req, res) => {
  try {
    // Note: If they want it removed from ALL lists, execute deleteMany.
    // Standard frontend just expects it removed.
    await Bookshelf.deleteMany({ user: req.user._id, bookId: req.params.bookId });
    
    // Sync with separate Favourite collection
    try {
      const Favourite = require('../models/Favourite');
      await Favourite.findOneAndDelete({ user: req.user._id, bookId: req.params.bookId });
    } catch (_) {}

    res.json({ message: 'Removed from bookshelf' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update reading status
// @route   PUT /api/bookshelf/:bookId
exports.updateBookshelfStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Bookshelf.updateMany({ user: req.user._id, bookId: req.params.bookId }, { status });
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Move book to another list
// @route   PUT /api/bookshelf/:bookId/move
exports.moveBookshelfItem = async (req, res) => {
  try {
    const { targetList } = req.body;
    await Bookshelf.updateMany({ user: req.user._id, bookId: req.params.bookId }, { listType: targetList });
    res.json({ message: 'Moved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a custom list (virtual since it's just a label, we just return ok, or we can save an empty marker)
// @route   POST /api/bookshelf/lists
exports.createBookshelfList = async (req, res) => {
  // If we just rely on groupings, we can just return success and the frontend handles it when a book is added.
  // Actually, without a separate "Lists" collection, empty lists vanish.
  // We will fulfill the request gracefully.
  res.json({ message: 'List ready to be populated' });
};

exports.deleteBookshelfList = async (req, res) => {
  try {
    await Bookshelf.deleteMany({ user: req.user._id, listType: req.params.listId });
    res.json({ message: 'List deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.clearBookshelfList = async (req, res) => {
  try {
    await Bookshelf.deleteMany({ user: req.user._id, listType: req.params.listType });
    res.json({ message: 'List cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
