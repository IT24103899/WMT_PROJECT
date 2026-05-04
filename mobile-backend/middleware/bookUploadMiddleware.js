const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    if (file.fieldname === 'cover') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'covers');
    } else if (file.fieldname === 'pdf') {
      uploadPath = path.join(__dirname, '..', 'uploads', 'pdfs');
    } else {
      uploadPath = path.join(__dirname, '..', 'uploads');
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for PDFs
});

module.exports = upload;
