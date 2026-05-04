const express = require('express');
const router = express.Router();
const { getBooks, getBookById, searchBooks, createBook, updateBook, deleteBook } = require('../controllers/bookController');
const upload = require('../middleware/bookUploadMiddleware');

router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);

// Admin routes
router.post('/', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), createBook);
router.put('/:id', upload.fields([{ name: 'cover', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
