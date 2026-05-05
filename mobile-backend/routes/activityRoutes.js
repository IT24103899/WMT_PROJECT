const express = require('express');
const router = express.Router();
const { updateActivity, getHistory, getReadingStats, getReadingProgress } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, updateActivity) // Fallback backwards compat
  .get(protect, getHistory);

router.post('/progress', protect, updateActivity);
router.get('/progress/:bookId', protect, getReadingProgress);
router.get('/stats', protect, getReadingStats);

module.exports = router;
