const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

// Ensure one rating per user per book
ratingSchema.index({ user: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
