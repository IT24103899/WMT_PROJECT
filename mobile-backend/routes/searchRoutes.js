const express = require('express');
const router = express.Router();
const { getSearchHistory, saveSearchHistory, clearSearchHistory } = require('../controllers/searchHistoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/history')
  .get(getSearchHistory)
  .post(saveSearchHistory)
  .delete(clearSearchHistory);

module.exports = router;
