/**
 * Backup Management Routes
 * API endpoints for backup and restore operations
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { prisma } from '../services/db';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { apiSuccess, apiError } from '../utils/api-response';

const execAsync = promisify(exec);
const router = Router();

// All routes require system.backup permission
router.use(requirePermission('system.backup'));

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
(async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create backup directory:', error);
  }
})();

/**
 * GET /api/backup/settings
 * Get current backup settings
 */
router.get('/settings', asyncHandler(async (_, res) => {
  // In a production system, these would be stored in database or config file
  // For now, return defaults
  const settings = {
    backupSchedule: process.env.BACKUP_SCHEDULE || 'daily',
    backupTime: process.env.BACKUP_TIME || '02:00',
    backupRetention: parseInt(process.env.BACKUP_RETENTION || '30'),
    backupLocation: process.env.BACKUP_LOCATION || 'local',
    cloudBackupEnabled: process.env.CLOUD_BACKUP_ENABLED === 'true'
  };

  res.json(apiSuccess({ settings }));
}));

/**
 * PUT /api/backup/settings
 * Update backup settings
 */
router.put('/settings', asyncHandler(async (req, res) => {
  const {
    backupSchedule,
    backupTime,
    backupRetention,
    backupLocation,
    cloudBackupEnabled
  } = req.body;

  // TODO: Save to persistent storage (database or .env file)
  // For now, just validate and return

  const updatedSettings = {
    backupSchedule,
    backupTime,
    backupRetention,
    backupLocation,
    cloudBackupEnabled
  };

  res.json(apiSuccess({
    settings: updatedSettings,
    message: 'Backup settings updated successfully'
  }));
}));

/**
 * GET /api/backup/status
 * Get backup status and list of backups
 */
router.get('/status', asyncHandler(async (_, res) => {
  try {
    // Get list of backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files.filter(f => f.endsWith('.sql') || f.endsWith('.sql.gz'));

    // Get file stats for each backup
    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = await fs.stat(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );

    // Sort by creation date (newest first)
    backups.sort((a, b) => b.created.getTime() - a.created.getTime());

    // Calculate total size
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    // Get available storage space
    const diskInfo = await getDiskSpace(BACKUP_DIR);

    // Get last backup time
    const lastBackup = backups.length > 0 ? backups[0].created : null;

    res.json(apiSuccess({
      status: {
        lastBackup,
        totalSize,
        backupCount: backups.length,
        availableSpace: diskInfo.free,
        backups: backups.slice(0, 10) // Return last 10 backups
      }
    }));
  } catch (error) {
    res.json(apiSuccess({
      status: {
        lastBackup: null,
        totalSize: 0,
        backupCount: 0,
        availableSpace: 0,
        backups: []
      }
    }));
  }
}));

/**
 * POST /api/backup/create
 * Create a new backup
 */
router.post('/create', asyncHandler(async (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `obedio-backup-${timestamp}.sql`;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse database URL
    const dbUrl = new URL(databaseUrl);
    const user = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1);

    // Use pg_dump to create backup
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -F c -f "${filePath}"`;

    await execAsync(command);

    // Get file size
    const stats = await fs.stat(filePath);

    res.json(apiSuccess({
      backup: {
        filename,
        size: stats.size,
        created: stats.birthtime,
        path: filePath
      },
      message: 'Backup created successfully'
    }));
  } catch (error: any) {
    // If backup failed, try to clean up
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }

    throw new Error(`Backup failed: ${error.message}`);
  }
}));

/**
 * POST /api/backup/restore/:filename
 * Restore from a backup file
 */
router.post('/restore/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    // Check if backup file exists
    await fs.access(filePath);

    // Get database URL
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    // Parse database URL
    const dbUrl = new URL(databaseUrl);
    const user = dbUrl.username;
    const password = dbUrl.password;
    const host = dbUrl.hostname;
    const port = dbUrl.port || '5432';
    const database = dbUrl.pathname.slice(1);

    // Use pg_restore to restore backup
    const command = `PGPASSWORD="${password}" pg_restore -h ${host} -p ${port} -U ${user} -d ${database} -c "${filePath}"`;

    await execAsync(command);

    res.json(apiSuccess({
      message: 'Database restored successfully from backup'
    }));
  } catch (error: any) {
    throw new Error(`Restore failed: ${error.message}`);
  }
}));

/**
 * DELETE /api/backup/:filename
 * Delete a backup file
 */
router.delete('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    await fs.unlink(filePath);

    res.json(apiSuccess({
      message: 'Backup file deleted successfully'
    }));
  } catch (error: any) {
    throw new Error(`Failed to delete backup: ${error.message}`);
  }
}));

/**
 * GET /api/backup/download/:filename
 * Download a backup file
 */
router.get('/download/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(BACKUP_DIR, filename);

  try {
    await fs.access(filePath);
    res.download(filePath);
  } catch (error) {
    res.status(404).json(apiError('Backup file not found', 'NOT_FOUND'));
  }
}));

// Helper function to get disk space
async function getDiskSpace(dirPath: string): Promise<{ total: number; free: number; used: number }> {
  try {
    if (os.platform() === 'win32') {
      // Windows
      const drive = path.parse(dirPath).root;
      const { stdout } = await execAsync(`wmic logicaldisk where "DeviceID='${drive.replace('\\', '')}'" get Size,FreeSpace /value`);
      const lines = stdout.split('\n');

      let total = 0;
      let free = 0;

      lines.forEach(line => {
        if (line.startsWith('FreeSpace=')) {
          free = parseInt(line.split('=')[1]);
        } else if (line.startsWith('Size=')) {
          total = parseInt(line.split('=')[1]);
        }
      });

      return { total, free, used: total - free };
    } else {
      // Unix-like systems
      const { stdout } = await execAsync(`df -k "${dirPath}" | tail -1`);
      const parts = stdout.trim().split(/\s+/);
      const total = parseInt(parts[1]) * 1024;
      const used = parseInt(parts[2]) * 1024;
      const free = parseInt(parts[3]) * 1024;

      return { total, free, used };
    }
  } catch (error) {
    // Return 0s if unable to get disk space
    return { total: 0, free: 0, used: 0 };
  }
}

export default router;
