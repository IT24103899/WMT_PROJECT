const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header exists and has Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Isolate token payload
      token = req.headers.authorization.split(' ')[1];
      console.log('🔐 [AUTH] Token received length:', token ? token.length : 0);
      
      if (!token || token === 'undefined') {
        console.log('❌ [AUTH] Token is null/undefined/string');
        return res.status(401).json({ message: 'Not authorized: Token is invalid' });
      }

      // Decode the JWT token against Server secure signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_super_secret');
      console.log('✅ [AUTH] Token verified for user:', decoded.id);

      // Intercept the authenticated user's ID globally into the req layer WITHOUT exposing password hashes
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      console.error('❌ [AUTH] Error:', error.message);
      res.status(401).json({ message: 'Not authorized: Validation Token Failed or Expired', error: error.message });
    }
  } else {
    console.log('⚠️ [AUTH] No authorization header or Bearer prefix');
    res.status(401).json({ message: 'Not authorized: Access Token Missing' });
  }
};

module.exports = { protect };
