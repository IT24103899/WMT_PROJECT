const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_super_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please add all required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    if (user) {
      // --- SEND WELCOME EMAIL (Awaited to capture errors during debugging) ---
      try {
        await sendEmail({
          email: user.email,
          subject: 'Welcome to E-Library! 📚',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #4f46e5; text-align: center;">Welcome, ${user.name}!</h2>
              <p>Thank you for joining our E-Library family. We are excited to have you on board!</p>
              <p>You can now explore thousands of books, track your reading progress, and use our AI Genius to find your next favorite story.</p>
              <p style="font-size: 0.8em; color: #777; text-align: center;">If you didn't create this account, please ignore this email.</p>
            </div>
          `
        });
      } catch (emailErr) {
        console.error('❌ Welcome Email Error:', emailErr.message);
        // We continue anyway, but log it clearly
      }

      res.status(201).json({

        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });
    
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const tok = generateToken(user._id);
    return res.json({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: tok
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    const emailToSearch = email.trim().toLowerCase();
    console.log('🔍 Forgot Password request for:', emailToSearch);
    const user = await User.findOne({ email: emailToSearch });

    if (!user) {
      console.log('❌ No user found for:', emailToSearch);
      return res.status(404).json({ message: 'No user found with that email. Please check the spelling or register first.' });
    }

    // Generate 6-digit numeric OTP
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔑 Generated OTP for ${user.email}: ${resetToken}`);
    
    // Store OTP and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    // Explicitly save the changes
    await user.save();
    console.log('💾 User record updated with OTP successfully');

    // Send email (Awaited for better error tracking during development)
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Verification Code 🔐',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
            <p>Hello ${user.name || 'User'},</p>
            <p>You requested to reset your password. Use the following 6-digit verification code to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <h1 style="letter-spacing: 10px; color: #4f46e5; background: #f3f4f6; padding: 20px; border-radius: 10px; display: inline-block;">${resetToken}</h1>
            </div>
            <p>This code will expire in <b>10 minutes</b>. If you didn't request this, please ignore this email.</p>
            <p>Regards,<br>E-Library Support Team</p>
          </div>
        `
      });
      console.log('✅ Reset email sent successfully to:', user.email);
      res.status(200).json({ 
        success: true,
        message: 'A verification code has been sent to your email.' 
      });
    } catch (err) {
      console.error('❌ Reset Email Error:', err);
      res.status(500).json({ 
        success: false,
        message: `Error sending verification email: ${err.message}`,
        debug: 'Ensure EMAIL_USER and EMAIL_PASS are correct in .env'
      });
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        isPremium: user.isPremium
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.email) user.email = req.body.email.toLowerCase();
      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Change user password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please upload an image' });
    const user = await User.findById(req.user._id);
    if (user) {
      const filePath = `/uploads/profiles/${req.file.filename}`;
      user.profileImage = filePath;
      await user.save();
      res.json({ message: 'Avatar updated', profileImage: filePath });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  registerUser, 
  loginUser, 
  getProfile, 
  updateProfile, 
  changePassword,
  updateAvatar,
  forgotPassword,
  resetPassword
};
