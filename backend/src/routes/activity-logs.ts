import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('system.view-logs'), asyncHandler(async (req, res) => {
  const { type, userId, locationId, page, limit } = req.query;
  const filters = { type: type as string, userId: userId as string, locationId: locationId as string, page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 50 };
  const result = await dbService.getActivityLogs(filters);
  res.json({ success: true, data: result.items, pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages } });
}));

router.post('/', requirePermission('system.create-logs'), asyncHandler(async (req, res) => {
  const log = await dbService.createActivityLog(req.body);
  res.status(201).json({ success: true, data: log });
}));

export default router;