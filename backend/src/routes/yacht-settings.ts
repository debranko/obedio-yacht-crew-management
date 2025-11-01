import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get yacht settings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
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

    res.json({
      success: true,
      data: {
        name: settings.name,
        type: settings.type,
        timezone: settings.timezone,
        floors: settings.floors,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        weatherUnits: settings.weatherUnits,
        windSpeedUnits: settings.windSpeedUnits,
        // GPS Location fields
        latitude: settings.latitude,
        longitude: settings.longitude,
        accuracy: settings.accuracy,
        locationName: settings.locationName,
        locationUpdatedAt: settings.locationUpdatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching yacht settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch yacht settings',
    });
  }
});

// Update yacht settings
router.put('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      name, type, timezone, floors, dateFormat, timeFormat, weatherUnits, windSpeedUnits,
      latitude, longitude, accuracy, locationName, locationUpdatedAt
    } = req.body;

    // Validate input
    if (!name || !type || !timezone) {
      return res.status(400).json({
        success: false,
        error: 'Yacht name, type, and timezone are required',
      });
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

    res.json({
      success: true,
      data: {
        name: settings.name,
        type: settings.type,
        timezone: settings.timezone,
        floors: settings.floors,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        weatherUnits: settings.weatherUnits,
        windSpeedUnits: settings.windSpeedUnits,
        // GPS Location fields
        latitude: settings.latitude,
        longitude: settings.longitude,
        accuracy: settings.accuracy,
        locationName: settings.locationName,
        locationUpdatedAt: settings.locationUpdatedAt,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating yacht settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update yacht settings',
    });
  }
});

export default router;