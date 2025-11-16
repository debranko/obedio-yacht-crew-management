import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import OpenAI from 'openai';
import { authMiddleware } from '../middleware/auth';
import { apiSuccess, apiError } from '../utils/api-response';
import { prisma } from '../services/db';
import { ServiceRequestType } from '@prisma/client';
import { websocketService } from '../services/websocket';
import { mqttService } from '../services/mqtt.service';

const router = Router();

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../../uploads/images');
const audioUploadsDir = path.join(__dirname, '../../uploads/audio');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created images uploads directory:', uploadsDir);
}

if (!fs.existsSync(audioUploadsDir)) {
  fs.mkdirSync(audioUploadsDir, { recursive: true });
  console.log('📁 Created audio uploads directory:', audioUploadsDir);
}

// Initialize OpenAI client (only if API key is available)
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI client initialized for audio transcription');
} else {
  console.warn('⚠️ OPENAI_API_KEY not configured - audio transcription will not be available');
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Multer upload middleware for images
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  }
});

// Audio storage configuration
const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with proper extension
    const ext = path.extname(file.originalname) || '.wav';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recording-${uniqueSuffix}${ext}`);
  }
});

// Audio file filter
const audioFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/webm',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/m4a'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'));
  }
};

// Multer upload middleware for audio
const audioUpload = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max file size (for 30s recordings)
  }
});

/**
 * POST /api/upload/upload-audio
 * Upload audio file from ESP32, transcribe with OpenAI Whisper, and create service request
 * 
 * This endpoint handles voice recordings from ESP32 smart buttons:
 * 1. Receives audio file (WAV/WebM) from ESP32
 * 2. Saves file to uploads/audio/
 * 3. Transcribes using OpenAI Whisper (if configured)
 * 4. Creates service request with voice transcript
 * 5. Notifies crew via WebSocket and MQTT
 * 
 * ESP32 sends: audio file + optional deviceId, locationId, priority
 */
router.post('/upload-audio', audioUpload.single('audio'), async (req, res) => {
  console.log('📥 Audio upload endpoint hit from ESP32');

  try {
    if (!req.file) {
      console.log('❌ No audio file in request');
      return res.status(400).json(apiError('No audio file provided', 'VALIDATION_ERROR'));
    }

    console.log('🎙️ Audio file received:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      path: req.file.path
    });

    // Extract optional parameters from request body
    const deviceId = req.body.deviceId || null;
    const locationId = req.body.locationId || null;
    const priority = req.body.priority || 'normal';

    // Generate audio URL for access
    const audioUrl = `/uploads/audio/${req.file.filename}`;

    let transcript = null;
    let translation = null;
    let detectedLanguage = null;

    // STEP 1: Transcribe audio if OpenAI is configured
    if (openai) {
      try {
        console.log('🌍 Transcribing audio with OpenAI Whisper...');
        
        // Get original transcription in guest's language
        const audioFileOriginal = fs.createReadStream(req.file.path);
        const originalTranscription = await openai.audio.transcriptions.create({
          file: audioFileOriginal,
          model: 'whisper-1',
          response_format: 'verbose_json' // Get language info
        });

        transcript = originalTranscription.text;
        detectedLanguage = originalTranscription.language;

        console.log('✅ Original transcription:', {
          text: transcript,
          language: detectedLanguage
        });

        // Get English translation if not already English
        if (detectedLanguage !== 'en' && detectedLanguage !== 'english') {
          console.log('🇬🇧 Translating to English...');
          const audioFileTranslation = fs.createReadStream(req.file.path);
          const translationResult = await openai.audio.translations.create({
            file: audioFileTranslation,
            model: 'whisper-1',
            response_format: 'json'
          });
          translation = translationResult.text;
          console.log('✅ English translation:', translation);
        } else {
          translation = transcript; // Already in English
        }

      } catch (transcriptionError: any) {
        console.error('⚠️ Transcription failed, but audio saved:', transcriptionError.message);
        // Continue anyway - audio is saved, we'll create request without transcript
        transcript = '[Transcription failed - audio saved for manual review]';
        translation = transcript;
      }
    } else {
      console.warn('⚠️ OpenAI not configured - skipping transcription');
      transcript = '[Transcription service not configured - audio saved for manual review]';
      translation = transcript;
    }

    // STEP 2: Create service request with voice transcript
    let serviceRequest = null;
    let device = null;
    let guest = null;

    try {
      // Find device if deviceId provided
      if (deviceId) {
        device = await prisma.device.findUnique({
          where: { deviceId },
          include: { location: true }
        });

        if (!device) {
          console.warn(`⚠️ Device ${deviceId} not found - creating anonymous request`);
        }
      }

      // Find guest for the location
      const effectiveLocationId = locationId || device?.locationId;
      if (effectiveLocationId) {
        guest = await prisma.guest.findFirst({
          where: { locationId: effectiveLocationId },
          orderBy: { createdAt: 'desc' }
        });
      }

      // Build voice notes with transcript and translation
      let voiceNotes = `Voice Message (${detectedLanguage || 'unknown'} language):\n`;
      voiceNotes += `Original: "${transcript}"\n`;
      if (translation && translation !== transcript) {
        voiceNotes += `English: "${translation}"\n`;
      }
      voiceNotes += `\nAudio: ${audioUrl}`;
      if (device) {
        voiceNotes += `\n\nDevice: ${device.name || deviceId}`;
        voiceNotes += `\nLocation: ${device.location?.name || 'Unknown'}`;
      }

      // Create service request
      serviceRequest = await prisma.serviceRequest.create({
        data: {
          requestType: ServiceRequestType.voice,
          priority: priority as any,
          status: 'pending',
          voiceTranscript: transcript,
          notes: voiceNotes,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
          guestCabin: device?.location?.name || 'Unknown',
          ...(guest?.id && {
            guest: { connect: { id: guest.id } }
          }),
          ...(effectiveLocationId && {
            location: { connect: { id: effectiveLocationId } }
          })
        },
        include: {
          guest: true,
          location: true,
        }
      });

      console.log('✅ Service request created with voice transcript:', serviceRequest.id);

      // Log to activity log
      await prisma.activityLog.create({
        data: {
          type: 'device',
          action: 'Voice Message',
          details: `Voice message received from ${guest ? guest.firstName + ' ' + guest.lastName : 'Guest'} at ${device?.location?.name || 'Unknown'}. Transcript: "${transcript?.substring(0, 100)}${transcript && transcript.length > 100 ? '...' : ''}"`,
          locationId: effectiveLocationId,
          guestId: guest?.id,
          deviceId: device?.id,
          metadata: JSON.stringify({
            audioUrl,
            transcript,
            translation,
            language: detectedLanguage,
            requestId: serviceRequest.id,
            fileSize: req.file.size
          })
        }
      });

      // Emit WebSocket event for real-time frontend update
      const io = websocketService.getIO();
      if (io) {
        console.log('📡 Emitting service-request:created via WebSocket');
        io.emit('service-request:created', serviceRequest);
      }

      // Notify crew watches via MQTT
      await mqttService.notifyAssignedCrewWatch(
        serviceRequest,
        device?.location?.name || 'Unknown',
        guest
      );

    } catch (serviceRequestError: any) {
      console.error('⚠️ Failed to create service request:', serviceRequestError.message);
      // Continue - audio and transcription still successful
    }

    // STEP 3: Return response to ESP32
    res.json(apiSuccess({
      audioUrl,
      filename: req.file.filename,
      size: req.file.size,
      transcript: transcript,
      translation: translation,
      language: detectedLanguage,
      duration: req.body.duration ? parseFloat(req.body.duration) : null,
      serviceRequest: serviceRequest ? {
        id: serviceRequest.id,
        status: serviceRequest.status,
        requestType: serviceRequest.requestType
      } : null,
      message: 'Audio uploaded and transcribed successfully'
    }));

  } catch (error: any) {
    console.error('❌ Audio upload error:', error);

    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json(apiError(
      error.message || 'Failed to upload audio',
      'AUDIO_UPLOAD_ERROR',
      { details: error.toString() }
    ));
  }
});

/**
 * POST /api/upload/image
 * Upload a single image file
 */
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(apiError('No file uploaded', 'VALIDATION_ERROR'));
    }

    // Return URL to access the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;

    console.log('✅ Image uploaded:', req.file.filename);

    res.json(apiSuccess({
      filename: req.file.filename,
      url: imageUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: 'Image uploaded successfully'
    }));
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json(apiError(error.message || 'Failed to upload image', 'UPLOAD_ERROR'));
  }
});

/**
 * DELETE /api/upload/image/:filename
 * Delete an uploaded image
 */
router.delete('/image/:filename', authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(apiError('Image not found', 'NOT_FOUND'));
    }

    // Delete file
    fs.unlinkSync(filePath);
    console.log('🗑️  Image deleted:', filename);

    res.json(apiSuccess({
      deleted: true,
      filename,
      message: 'Image deleted successfully'
    }));
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json(apiError(error.message || 'Failed to delete image', 'DELETE_ERROR'));
  }
});

export default router;
