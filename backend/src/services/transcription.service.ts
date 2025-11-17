/**
 * Shared Transcription Service
 * Uses OpenAI Whisper for speech-to-text transcription
 * Provides bilingual support: original language + English translation
 */

import OpenAI from 'openai';
import fs from 'fs';

// Singleton OpenAI client - initialized once and reused
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface TranscriptionResult {
  transcript: string;      // Original language transcript
  translation: string;     // English translation (or same as transcript if already English)
  language: string;        // Detected language code (e.g., 'en', 'es', 'fr')
}

/**
 * Transcribe audio file using OpenAI Whisper
 *
 * @param audioFilePath - Path to audio file on disk
 * @returns Promise with transcript, translation, and language
 *
 * Process:
 * 1. Transcribe audio in original language
 * 2. If not English, translate to English
 * 3. Return both original and English versions
 *
 * @throws Error if OpenAI API key is not configured or transcription fails
 */
export async function transcribeAudioFile(audioFilePath: string): Promise<TranscriptionResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in .env file.');
  }

  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  console.log('🌍 Step 1: Transcribing audio in original language...');

  // STEP 1: Get original transcription in guest's language
  const audioFileOriginal = fs.createReadStream(audioFilePath);
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
    const audioFileTranslation = fs.createReadStream(audioFilePath);
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

  console.log('✅ Transcription complete:', {
    original: originalTranscription.text,
    english: englishTranslation,
    language: originalTranscription.language
  });

  return {
    transcript: originalTranscription.text,      // Original language
    translation: englishTranslation,              // English translation
    language: originalTranscription.language || 'unknown'
  };
}

/**
 * Check if OpenAI API is configured and ready
 */
export function isTranscriptionConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
