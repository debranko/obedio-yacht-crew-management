/**
 * Voice Upload API Routes
 * Handles audio file uploads from ESP32 and returns public URL
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'voice');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const randomId = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.wav';
    const filename = `voice-${timestamp}-${randomId}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/ogg',
      'audio/m4a'
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.wav')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

/**
 * POST /api/voice/upload
 * Upload audio file and return public URL
 */
router.post('/upload', upload.single('audio'), async (req, res) => {
  console.log('📥 Voice upload endpoint hit');

  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    console.log('🎙️ Audio file uploaded:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Generate public URL
    const protocol = req.protocol;
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/voice/${req.file.filename}`;

    console.log('✅ Audio file uploaded successfully:', publicUrl);

    res.json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

  } catch (error: any) {
    console.error('❌ Voice upload error:', error);

    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload audio file',
      details: error.message
    });
  }
});

/**
 * GET /api/voice/test
 * Test endpoint to verify setup
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Voice upload service is ready',
    uploadsDir: uploadsDir
  });
});

export default router;
