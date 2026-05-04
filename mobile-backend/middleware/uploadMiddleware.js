const multer = require('multer');
const path = require('path');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'profiles');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Save as user-id-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Be robust: fallback if req.user is missing (e.g. debugging)
    const userId = req.user ? req.user._id : 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;
