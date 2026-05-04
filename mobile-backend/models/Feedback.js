const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  legacyId: { type: Number, default: null }, // Mapped from MySQL ID
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'general' },
  message: { type: String, required: true },
  rating: { type: Number },
  status: { type: String, default: 'pending' },
  appVersion: { type: String },
  deviceInfo: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
