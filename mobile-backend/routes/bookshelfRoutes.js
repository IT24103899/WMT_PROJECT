const express = require('express');
const router = express.Router();
const {
  getBookshelf,
  addToBookshelf,
  removeFromBookshelf,
  updateBookshelfStatus,
  moveBookshelfItem,
  createBookshelfList,
  deleteBookshelfList,
  clearBookshelfList
} = require('../controllers/bookshelfController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getBookshelf)
  .post(addToBookshelf);

router.post('/lists', createBookshelfList);
router.delete('/lists/:listId', deleteBookshelfList);
router.delete('/lists/:listType/clear', clearBookshelfList);

router.route('/:bookId')
  .delete(removeFromBookshelf)
  .put(updateBookshelfStatus);

router.put('/:bookId/move', moveBookshelfItem);

module.exports = router;
