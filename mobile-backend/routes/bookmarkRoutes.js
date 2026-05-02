const express = require('express');
const router = express.Router();
const { addBookmark, getBookmarks, deleteBookmark } = require('../controllers/bookmarkController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All bookmark routes require authentication

router.post('/', addBookmark);
router.get('/:bookId', getBookmarks);
router.delete('/:id', deleteBookmark);

module.exports = router;
