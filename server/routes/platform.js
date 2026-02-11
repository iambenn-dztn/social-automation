const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const platformController = require('../controllers/platformController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv|flv|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'));
    }
  }
});

// Get available platforms
router.get('/platforms', platformController.getPlatforms);

// Get channels for platform(s)
router.get('/channels', platformController.getChannels);

// Post to multiple channels
router.post('/post', upload.single('media'), platformController.postToChannels);

// Get posting history
router.get('/history', platformController.getHistory);

module.exports = router;
