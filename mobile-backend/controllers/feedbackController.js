const Feedback = require('../models/Feedback');

// @desc    Submit feedback
// @route   POST /api/v1/feedback
exports.submitFeedback = async (req, res) => {
  try {
    const { type, rating, message } = req.body;
    
    // Create feedback
    const feedback = await Feedback.create({
      userId: req.user ? req.user._id : null,
      type: type || 'general',
      rating: Number(rating) || 0,
      message: message || '',
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Feedback Submission Error:', error);
    res.status(500).json({ message: 'Error submitting feedback', error: error.message });
  }
};

// @desc    Get all feedback (Admin)
// @route   GET /api/v1/feedback
exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate('userId', 'name email')
      .sort('-createdAt');
    
    // Transform userId to user for frontend compatibility
    const formattedFeedback = feedback.map(f => {
      const obj = f.toObject();
      obj.user = obj.userId;
      return obj;
    });

    res.json(formattedFeedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

// @desc    Update feedback status (Admin)
// @route   PUT /api/v1/feedback/:id
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error updating feedback status', error: error.message });
  }
};
