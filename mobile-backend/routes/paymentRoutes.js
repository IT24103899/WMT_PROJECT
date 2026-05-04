const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Mock Upgrade to Premium Endpoint
router.post('/upgrade', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isPremium = true;
    await user.save();

    res.status(200).json({ success: true, message: 'Successfully upgraded to premium!', user });
  } catch (error) {
    console.error('Error in payment upgrade:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Get payment status
router.get('/status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, isPremium: user.isPremium || false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
