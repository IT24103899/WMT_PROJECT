const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Highlight = require('../models/Highlight');
const Rating = require('../models/Rating');
const User = require('../models/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

// Resolve userId (MongoDB ObjectId string OR numeric legacyId) → ObjectId
const resolveMongoUserId = async (userId) => {
  if (!userId) return null;
  const idStr = String(userId);
  if (MONGO_ID_REGEX.test(idStr)) {
    return new mongoose.Types.ObjectId(idStr);
  }
  const n = Number(idStr);
  if (!isNaN(n)) {
    const user = await User.findOne({ legacyId: n });
    return user ? user._id : null;
  }
  return null;
};

// Normalise bookId: prefer Number when the value parses cleanly, else keep as string
const resolveBookId = (id) => {
  if (id == null) return null;
  const n = Number(id);
  return isNaN(n) ? String(id) : n;
};

// Return a plain object with an `id` alias for the frontend
const toJson = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = String(obj._id);
  return obj;
};

// ─── Bookmark Routes ───────────────────────────────────────────────────────────

// GET /api/reader/bookmarks?userId=...&bookId=...
router.get('/bookmarks', async (req, res) => {
  try {
    const mongoUserId = await resolveMongoUserId(req.query.userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid or missing userId' });

    const filter = { user: mongoUserId };
    if (req.query.bookId != null) filter.bookId = resolveBookId(req.query.bookId);

    const bookmarks = await Bookmark.find(filter).sort('-createdAt');
    res.json(bookmarks.map(toJson));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/reader/bookmarks   body: { userId, bookId, pageNumber, note? }
router.post('/bookmarks', async (req, res) => {
  try {
    const { userId, bookId, pageNumber, note } = req.body;
    const mongoUserId = await resolveMongoUserId(userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid or missing userId' });
    if (bookId == null || pageNumber == null) return res.status(400).json({ message: 'bookId and pageNumber are required' });

    const resolvedBookId = resolveBookId(bookId);

    // Upsert: avoid duplicates for same user+book+page
    const bookmark = await Bookmark.findOneAndUpdate(
      { user: mongoUserId, bookId: resolvedBookId, pageNumber: Number(pageNumber) },
      { $set: { note: note || '', user: mongoUserId, bookId: resolvedBookId, pageNumber: Number(pageNumber) } },
      { upsert: true, new: true }
    );

    res.status(201).json(toJson(bookmark));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// DELETE /api/reader/bookmarks/:id
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const bookmark = await Bookmark.findByIdAndDelete(req.params.id);
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    res.json({ message: 'Bookmark deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// ─── Highlight Routes ─────────────────────────────────────────────────────────

// GET /api/reader/highlights?userId=...&bookId=...
router.get('/highlights', async (req, res) => {
  try {
    const mongoUserId = await resolveMongoUserId(req.query.userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid or missing userId' });

    const filter = { user: mongoUserId };
    if (req.query.bookId != null) filter.bookId = resolveBookId(req.query.bookId);

    const highlights = await Highlight.find(filter).sort('-createdAt');
    res.json(highlights.map(toJson));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/reader/highlights   body: { userId, bookId, pageNumber, content, color? }
router.post('/highlights', async (req, res) => {
  try {
    const { userId, bookId, pageNumber, content, color } = req.body;
    const mongoUserId = await resolveMongoUserId(userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid or missing userId' });
    if (bookId == null || pageNumber == null || !content) {
      return res.status(400).json({ message: 'bookId, pageNumber and content are required' });
    }

    const resolvedBookId = resolveBookId(bookId);
    const highlight = await Highlight.create({
      user: mongoUserId,
      bookId: resolvedBookId,
      pageNumber: Number(pageNumber),
      content: String(content),
      color: color || 'yellow'
    });

    res.status(201).json(toJson(highlight));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// PUT /api/reader/highlights/:id   body: { content?, color? }
router.put('/highlights/:id', async (req, res) => {
  try {
    const { content, color } = req.body;
    const highlight = await Highlight.findById(req.params.id);
    
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });

    if (content !== undefined) highlight.content = String(content);
    if (color !== undefined) highlight.color = String(color);

    await highlight.save();
    res.json(toJson(highlight));
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

router.delete('/highlights/:id', async (req, res) => {
  try {
    const highlight = await Highlight.findByIdAndDelete(req.params.id);
    if (!highlight) return res.status(404).json({ message: 'Highlight not found' });
    res.json({ message: 'Highlight deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// ─── Ratings ─────────────────────────────────────────────────────────────────
router.get('/rating', async (req, res) => {
  try {
    const { userId, bookId } = req.query;
    const mongoUserId = await resolveMongoUserId(userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid userId' });
    
    const rating = await Rating.findOne({ user: mongoUserId, bookId: resolveBookId(bookId) });
    res.json(rating || { rating: 0 });
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

router.post('/rating', async (req, res) => {
  try {
    const { userId, bookId, rating } = req.body;
    const mongoUserId = await resolveMongoUserId(userId);
    if (!mongoUserId) return res.status(400).json({ message: 'Invalid userId' });

    const updatedRating = await Rating.findOneAndUpdate(
      { user: mongoUserId, bookId: resolveBookId(bookId) },
      { rating: Number(rating) },
      { upsert: true, new: true }
    );

    res.json(updatedRating);
  } catch (e) {
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

module.exports = router;
