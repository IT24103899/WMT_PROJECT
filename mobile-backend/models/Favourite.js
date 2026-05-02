const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  bookId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    index: true
  },
  legacyId: { type: Number, default: null }
}, { timestamps: true, strict: false });

// Ensure a user cannot mathematically favourite exactly the same book twice inside Mongo logic rules
favouriteSchema.index({ user: 1, bookId: 1 }, { unique: true });

module.exports = mongoose.model('Favourite', favouriteSchema);
