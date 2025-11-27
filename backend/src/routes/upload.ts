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
 * NEW ASYNC ARCHITECTURE (2025-01-25):
 * - Returns 200 IMMEDIATELY after file is saved (ESP32 doesn't need to wait)
 * - Transcription happens in BACKGROUND
 * - Service request created on server (ESP32 doesn't send MQTT for voice)
 * - Dashboard notified via WebSocket
 *
 * ESP32 sends: audio file + deviceId (required for service request creation)
 */
router.post('/upload-audio', audioUpload.single('audio'), async (req, res) => {
  console.log('📥 Audio upload endpoint hit');

  try {
    if (!req.file) {
      console.log('❌ No audio file in request');
      return res.status(400).json(apiError('No audio file provided', 'VALIDATION_ERROR'));
    }

    console.log('🎙️ Audio file received:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename
    });

    // Extract parameters from request body
    const deviceId = req.body.deviceId || null;

    // Generate audio URL for access (use actual host from request)
    const protocol = req.secure ? 'https' : 'http';
    const host = req.get('host') || 'localhost:8080';
    const audioUrl = `${protocol}://${host}/uploads/audio/${req.file.filename}`;

    // Store file info for background processing
    const filePath = req.file.path;
    const fileSize = req.file.size;

    // ============================================================
    // RESPOND IMMEDIATELY - Don't make ESP32 wait for transcription!
    // ============================================================
    res.json(apiSuccess({
      audioUrl,
      filename: req.file.filename,
      size: fileSize,
      message: 'Audio uploaded - processing in background'
    }));

    // ============================================================
    // BACKGROUND PROCESSING - Transcribe & create service request
    // ============================================================
    setImmediate(async () => {
      let transcript: string | null = null;
      let translation: string | null = null;
      let detectedLanguage: string | null = null;

      // STEP 1: Transcribe audio if OpenAI is configured
      if (openai) {
        try {
          const startTime = Date.now();
          console.log('🌍 [Background] Transcribing audio with OpenAI Whisper...');

          // Run transcription and translation IN PARALLEL
          const audioFileOriginal = fs.createReadStream(filePath);
          const audioFileTranslation = fs.createReadStream(filePath);

          const [originalTranscription, translationResult] = await Promise.all([
            openai.audio.transcriptions.create({
              file: audioFileOriginal,
              model: 'whisper-1',
              response_format: 'verbose_json'
            }),
            openai.audio.translations.create({
              file: audioFileTranslation,
              model: 'whisper-1',
              response_format: 'json'
            })
          ]);

          const apiTime = Date.now() - startTime;

          transcript = originalTranscription.text;
          detectedLanguage = originalTranscription.language;
          translation = translationResult.text;

          // If already English, use original as translation
          if (detectedLanguage === 'en' || detectedLanguage === 'english') {
            translation = transcript;
          }

          console.log(`✅ [Background] Transcription completed in ${apiTime}ms:`, {
            text: transcript?.substring(0, 100),
            language: detectedLanguage
          });

        } catch (transcriptionError: any) {
          console.error('⚠️ [Background] Transcription failed:', transcriptionError.message);
          transcript = '[Transcription failed - audio saved for manual review]';
          translation = transcript;
        }
      } else {
        console.warn('⚠️ [Background] OpenAI not configured');
        transcript = '[Transcription service not configured]';
        translation = transcript;
      }

      // STEP 2: Create service request if deviceId provided
      if (deviceId) {
        try {
          // Find the device and its location
          const device = await prisma.device.findFirst({
            where: {
              OR: [
                { id: deviceId },
                { deviceId: deviceId }
              ]
            },
            include: {
              location: {
                include: {
                  guests: {
                    where: { status: 'onboard' },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                  }
                }
              }
            }
          });

          if (device) {
            const guest = device.location?.guests?.[0];

            // Create service request
            const serviceRequest = await prisma.serviceRequest.create({
              data: {
                ...(guest?.id && {
                  guest: { connect: { id: guest.id } }
                }),
                ...(device.locationId && {
                  location: { connect: { id: device.locationId } }
                }),
                status: 'pending',
                priority: 'normal',
                requestType: ServiceRequestType.call,
                notes: `Voice request from ${device.location?.name || 'Unknown location'}`,
                guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
                guestCabin: device.location?.name || 'Unknown',
                voiceTranscript: translation || transcript,
                voiceAudioUrl: audioUrl,
              },
              include: {
                guest: true,
                location: true,
              }
            });

            console.log('✅ [Background] Service request created:', serviceRequest.id);

            // Emit to WebSocket clients
            websocketService.emitServiceRequestCreated(serviceRequest);

            // Publish to MQTT for watches
            mqttService.publish('obedio/service/created', {
              requestId: serviceRequest.id,
              type: serviceRequest.requestType,
              priority: serviceRequest.priority,
              locationId: serviceRequest.locationId,
              locationName: serviceRequest.location?.name,
              guestName: serviceRequest.guestName,
              voiceTranscript: serviceRequest.voiceTranscript,
              voiceAudioUrl: serviceRequest.voiceAudioUrl,
              timestamp: new Date().toISOString()
            });

          } else {
            console.warn('⚠️ [Background] Device not found:', deviceId);
          }
        } catch (dbError: any) {
          console.error('❌ [Background] Service request creation failed:', dbError.message);
        }
      } else {
        console.log('ℹ️ [Background] No deviceId provided - skipping service request creation');
      }
    });

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
