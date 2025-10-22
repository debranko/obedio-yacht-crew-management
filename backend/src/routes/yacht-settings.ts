import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get yacht settings
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // For now, return from a settings table or use defaults
    // TODO: Create YachtSettings table in Prisma schema
    const settings = {
      name: 'Serenity',
      type: 'motor',
      timezone: 'Europe/Monaco',
      floors: ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      weatherUnits: 'metric',
      windSpeedUnits: 'knots',
    };

    res.json({
      success: true,
      data: settings,
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
    const { name, type, timezone, floors, dateFormat, timeFormat, weatherUnits, windSpeedUnits } = req.body;

    // TODO: Validate input
    // TODO: Store in database
    console.log('Updating yacht settings:', req.body);

    const updatedSettings = {
      name: name || 'Serenity',
      type: type || 'motor',
      timezone: timezone || 'Europe/Monaco',
      floors: floors || ['Lower Deck', 'Main Deck', 'Upper Deck', 'Sun Deck'],
      dateFormat: dateFormat || 'DD/MM/YYYY',
      timeFormat: timeFormat || '24h',
      weatherUnits: weatherUnits || 'metric',
      windSpeedUnits: windSpeedUnits || 'knots',
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: updatedSettings,
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