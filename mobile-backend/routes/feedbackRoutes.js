const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback, updateFeedbackStatus } = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitFeedback);
router.get('/', protect, getAllFeedback); // Admin normally, but for now protect is enough
router.put('/:id', protect, updateFeedbackStatus);

module.exports = router;
