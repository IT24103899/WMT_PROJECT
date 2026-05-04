const SearchHistory = require('../models/SearchHistory');

// @desc    Get user search history
// @route   GET /api/search/history
exports.getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort('-createdAt')
      .limit(10);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching search history', error: error.message });
  }
};

// @desc    Save search query
// @route   POST /api/search/history
exports.saveSearchHistory = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || query.trim() === '') return res.status(400).json({ message: 'Search term required' });

    // Ensure no excessive duplicates by just returning if it's identical
    const last = await SearchHistory.findOne({ userId: req.user._id }).sort('-createdAt');
    if (last && last.term === query.trim()) {
      return res.status(200).json(last);
    }

    const item = await SearchHistory.create({
      userId: req.user._id,
      term: query.trim()
    });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error saving search history', error: error.message });
  }
};

// @desc    Clear search history
// @route   DELETE /api/search/history
exports.clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ userId: req.user._id });
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
