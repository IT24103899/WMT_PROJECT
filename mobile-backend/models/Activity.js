const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  bookId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  pageNumber: {
    type: Number,
    required: true,
    default: 0
  },
  lastReadAt: {
    type: Date,
    default: Date.now
  },
  legacyId: { type: Number, default: null }
}, { timestamps: true, strict: false });

// Auto-indexes designed physically to drastically improve array lookups natively internally for a generic user's timeline history
activitySchema.index({ user: 1, lastReadAt: -1 });
activitySchema.index({ user: 1, bookId: 1 });

// Returns true if the activity was recorded recently (within 24 hours)
activitySchema.methods.isRecentActivity = function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.lastReadAt > oneDayAgo;
};

module.exports = mongoose.model('Activity', activitySchema);