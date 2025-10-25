/**
 * Voice Transcription API Routes
 * Uses OpenAI Whisper for speech-to-text
 */

import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads with proper file extensions
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    // Get file extension from mimetype
    const ext = file.mimetype.split('/')[1] || 'webm';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/transcribe
 * Transcribe audio file using OpenAI Whisper
 */
router.post('/', upload.single('audio'), async (req, res) => {
  console.log('📥 Transcribe endpoint hit');
  
  try {
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    console.log('🎙️ Transcribing audio file:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Create a readable stream from the uploaded file
    const audioFile = fs.createReadStream(req.file.path);

    // Call OpenAI Whisper API - Using TRANSLATIONS endpoint
    // This will auto-detect any language and translate to English
    const transcription = await openai.audio.translations.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'json'
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('✅ Transcription successful:', transcription.text);

    res.json({
      success: true,
      transcript: transcription.text,
      duration: req.body.duration ? parseFloat(req.body.duration) : null
    });

  } catch (error: any) {
    console.error('❌ Transcription error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data
    });

    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to transcribe audio',
      error: error.message,
      details: error.response?.data || error.toString()
    });
  }
});

/**
 * POST /api/transcribe/test
 * Test endpoint to verify setup
 */
router.get('/test', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  res.json({
    success: true,
    message: 'Transcription service is ready',
    openai: {
      configured: hasApiKey,
      keyPreview: hasApiKey ? `${process.env.OPENAI_API_KEY?.substring(0, 10)}...` : 'not configured'
    }
  });
});

export default router;
