/**
 * Voice Transcription API Routes
 * Uses OpenAI Whisper for speech-to-text
 */

import express from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { apiSuccess, apiError } from '../utils/api-response';

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

// Initialize OpenAI client (only if API key is available)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

/**
 * POST /api/transcribe
 * Transcribe audio file using OpenAI Whisper
 */
router.post('/', upload.single('audio'), async (req, res) => {
  console.log('📥 Transcribe endpoint hit');

  try {
    // Check if OpenAI is configured
    if (!openai) {
      console.log('❌ OpenAI not configured');
      return res.status(503).json({
        success: false,
        message: 'Transcription service not configured. Please set OPENAI_API_KEY environment variable.'
      });
    }

    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json(apiError('No audio file provided', 'VALIDATION_ERROR'));
    }

    console.log('🎙️ Transcribing audio file:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // STEP 1: Get original transcription in guest's language
    console.log('🌍 Step 1: Transcribing in original language...');
    const audioFileOriginal = fs.createReadStream(req.file.path);
    const originalTranscription = await openai.audio.transcriptions.create({
      file: audioFileOriginal,
      model: 'whisper-1',
      response_format: 'verbose_json' // Get language info
    });

    console.log('✅ Original transcription:', {
      text: originalTranscription.text,
      language: originalTranscription.language
    });

    // STEP 2: Get English translation (only if not already English)
    let englishTranslation = originalTranscription.text;

    if (originalTranscription.language !== 'en' && originalTranscription.language !== 'english') {
      console.log('🇬🇧 Step 2: Translating to English...');
      const audioFileTranslation = fs.createReadStream(req.file.path);
      const translation = await openai.audio.translations.create({
        file: audioFileTranslation,
        model: 'whisper-1',
        response_format: 'json'
      });
      englishTranslation = translation.text;
      console.log('✅ English translation:', englishTranslation);
    } else {
      console.log('✅ Already in English, no translation needed');
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log('✅ Transcription complete:', {
      original: originalTranscription.text,
      english: englishTranslation,
      language: originalTranscription.language
    });

    // Return BOTH original and English translation
    res.json({
      success: true,
      transcript: originalTranscription.text, // Original language
      translation: englishTranslation, // English translation
      language: originalTranscription.language, // Detected language code
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

    res.status(500).json(apiError('Failed to transcribe audio', 'TRANSCRIPTION_ERROR', {
      error: error.message,
      details: error.response?.data || error.toString()
    }));
  }
});

/**
 * POST /api/transcribe/test
 * Test endpoint to verify setup
 */
router.get('/test', (req, res) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY;

  // Don't use apiSuccess wrapper - return direct structure
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
