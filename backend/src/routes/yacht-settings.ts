import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

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
        vesselName: settings.vesselName,
        vesselType: settings.vesselType,
        timezone: settings.timezone,
        floors: settings.floors,
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
    const { vesselName, vesselType, timezone, floors } = req.body;

    // Validate input
    if (!vesselName || !vesselType || !timezone) {
      return res.status(400).json({
        success: false,
        error: 'Vessel name, type, and timezone are required',
      });
    }

    // Get existing settings or create if not exists
    let settings = await prisma.yachtSettings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.yachtSettings.update({
        where: { id: settings.id },
        data: {
          vesselName,
          vesselType,
          timezone,
          floors: floors || [],
        },
      });
    } else {
      // Create new settings
      settings = await prisma.yachtSettings.create({
        data: {
          vesselName,
          vesselType,
          timezone,
          floors: floors || [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        vesselName: settings.vesselName,
        vesselType: settings.vesselType,
        timezone: settings.timezone,
        floors: settings.floors,
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