const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookId: { type: mongoose.Schema.Types.Mixed, required: true, index: true }, // numeric legacyId or ObjectId string
  pageNumber: { type: Number, required: true },
  content: { type: String, required: true },  // the highlighted text
  color: { type: String, default: 'yellow' }  // highlight color
}, { timestamps: true });

module.exports = mongoose.model('Highlight', highlightSchema);
