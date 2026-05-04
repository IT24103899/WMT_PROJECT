const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  legacyId: { type: Number, index: true }, // Crucial: Ties to the old MySQL ID for existing users Favourites/Activities
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  totalPages: { type: Number },
  coverUrl: { type: String },
  pdfUrl: { type: String },
  isbn: { type: String },
  publicationYear: { type: Number },
  category: { type: String },
  isDeleted: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
