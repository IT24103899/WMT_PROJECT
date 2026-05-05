const express = require('express');
const router = express.Router();
const { addFavourite, getFavourites, removeFavourite } = require('../controllers/favouriteController');
const { protect } = require('../middleware/authMiddleware');

// The protect middleware completely stops unauthorized users
router.route('/')
  .post(protect, addFavourite)
  .get(protect, getFavourites);

router.route('/:bookId')
  .delete(protect, removeFavourite);

module.exports = router;
