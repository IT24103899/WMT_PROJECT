const mongoose = require('mongoose');

const bookshelfSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  listType: { type: String, required: true, default: 'reading' }, // 'favourites', 'reading', 'wishlist', or custom
  status: { type: String, enum: ['want-to-read', 'currently-reading', 'completed'], default: 'want-to-read' }
}, { timestamps: true });

// Prevent duplicate books in the exact same list for a user
bookshelfSchema.index({ user: 1, bookId: 1, listType: 1 }, { unique: true });

module.exports = mongoose.model('Bookshelf', bookshelfSchema);
