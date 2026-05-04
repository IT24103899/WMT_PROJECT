const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  legacyId: { type: Number, default: null }, // Mapped from MySQL ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  term: { type: String, required: true },
  resultsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
