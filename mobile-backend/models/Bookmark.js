const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookId: { type: mongoose.Schema.Types.Mixed, required: true, index: true }, // numeric legacyId or ObjectId string
  pageNumber: { type: Number, required: true },
  note: { type: String, default: '' }
}, { timestamps: true });

// Compound index prevents duplicate bookmarks for the same user+book+page
bookmarkSchema.index({ user: 1, bookId: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
