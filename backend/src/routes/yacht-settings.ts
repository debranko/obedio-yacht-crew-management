import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';
import { websocketService } from '../services/websocket';
import { apiSuccess, apiError, ErrorMessages } from '../utils/api-response';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Get yacht settings
router.get('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  // Get settings from database or create default if not exists
  let settings = await prisma.yachtSettings.findFirst();

  if (!settings) {
    // Create default settings
    settings = await prisma.yachtSettings.create({
      data: {
        name: 'M/Y Serenity',
        type: 'motor',
        timezone: 'Europe/Monaco',
        floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
      },
    });
  }

  res.json(apiSuccess({
    name: settings.name,
    type: settings.type,
    timezone: settings.timezone,
    floors: settings.floors,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weatherUnits: settings.weatherUnits,
    windSpeedUnits: settings.windSpeedUnits,
    weatherUpdateInterval: settings.weatherUpdateInterval,
    // GPS Location fields
    latitude: settings.latitude,
    longitude: settings.longitude,
    accuracy: settings.accuracy,
    locationName: settings.locationName,
    locationUpdatedAt: settings.locationUpdatedAt,
  }));
}));

// Update yacht settings
router.put('/', authMiddleware, asyncHandler(async (req: Request, res: Response) => {
  const {
    name, type, timezone, floors, dateFormat, timeFormat, weatherUnits, windSpeedUnits,
    weatherUpdateInterval, latitude, longitude, accuracy, locationName, locationUpdatedAt
  } = req.body;

  // Validate input
  if (!name || !type || !timezone) {
    return res.status(400).json(apiError(
      'Yacht name, type, and timezone are required',
      'VALIDATION_ERROR'
    ));
  }

  // Get existing settings or create if not exists
  let settings = await prisma.yachtSettings.findFirst();

  const updateData: any = {
    name,
    type,
    timezone,
    floors: floors || ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
  };

  // Add optional fields if provided
  if (dateFormat) updateData.dateFormat = dateFormat;
  if (timeFormat) updateData.timeFormat = timeFormat;
  if (weatherUnits) updateData.weatherUnits = weatherUnits;
  if (windSpeedUnits) updateData.windSpeedUnits = windSpeedUnits;
  if (weatherUpdateInterval !== undefined) updateData.weatherUpdateInterval = weatherUpdateInterval;

  // Add GPS location fields if provided
  if (latitude !== undefined) updateData.latitude = latitude;
  if (longitude !== undefined) updateData.longitude = longitude;
  if (accuracy !== undefined) updateData.accuracy = accuracy;
  if (locationName !== undefined) updateData.locationName = locationName;
  if (locationUpdatedAt !== undefined) updateData.locationUpdatedAt = locationUpdatedAt;

  if (settings) {
    // Update existing settings
    settings = await prisma.yachtSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  } else {
    // Create new settings
    settings = await prisma.yachtSettings.create({
      data: updateData,
    });
  }

  // Emit WebSocket event for settings update
  websocketService.broadcast('settings:updated', {
    name: settings.name,
    type: settings.type,
    timezone: settings.timezone,
    floors: settings.floors,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weatherUnits: settings.weatherUnits,
    windSpeedUnits: settings.windSpeedUnits,
    weatherUpdateInterval: settings.weatherUpdateInterval,
    // GPS Location fields
    latitude: settings.latitude,
    longitude: settings.longitude,
    accuracy: settings.accuracy,
    locationName: settings.locationName,
    locationUpdatedAt: settings.locationUpdatedAt,
    updatedAt: settings.updatedAt,
  });

  res.json(apiSuccess({
    name: settings.name,
    type: settings.type,
    timezone: settings.timezone,
    floors: settings.floors,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    weatherUnits: settings.weatherUnits,
    windSpeedUnits: settings.windSpeedUnits,
    weatherUpdateInterval: settings.weatherUpdateInterval,
    // GPS Location fields
    latitude: settings.latitude,
    longitude: settings.longitude,
    accuracy: settings.accuracy,
    locationName: settings.locationName,
    locationUpdatedAt: settings.locationUpdatedAt,
    updatedAt: settings.updatedAt,
  }));
}));

export default router;