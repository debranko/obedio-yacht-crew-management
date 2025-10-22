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
          vesselName: 'M/Y Serenity',
          vesselType: 'motor-yacht',
          timezone: 'Europe/Monaco',
          floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
        },
      });
    }

    res.json({
      success: true,
      data: {
        name: settings.vesselName,
        type: settings.vesselType,
        timezone: settings.timezone,
        floors: settings.floors,
        dateFormat: 'DD/MM/YYYY', // Return default values for now
        timeFormat: '24h',
        weatherUnits: 'metric',
        windSpeedUnits: 'knots',
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
    const { name, type, timezone, floors } = req.body;

    // Validate input
    if (!name || !type || !timezone) {
      return res.status(400).json({
        success: false,
        error: 'Yacht name, type, and timezone are required',
      });
    }

    // Get existing settings or create if not exists
    let settings = await prisma.yachtSettings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.yachtSettings.update({
        where: { id: settings.id },
        data: {
          vesselName: name,
          vesselType: type,
          timezone,
          floors: floors || ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
        },
      });
    } else {
      // Create new settings
      settings = await prisma.yachtSettings.create({
        data: {
          vesselName: name,
          vesselType: type,
          timezone,
          floors: floors || ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
        },
      });
    }

    res.json({
      success: true,
      data: {
        name: settings.vesselName,
        type: settings.vesselType,
        timezone: settings.timezone,
        floors: settings.floors,
        dateFormat: 'DD/MM/YYYY', // Return default values for now
        timeFormat: '24h',
        weatherUnits: 'metric',
        windSpeedUnits: 'knots',
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