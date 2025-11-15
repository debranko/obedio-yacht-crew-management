import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { DatabaseService } from '../services/database';
import { apiSuccess } from '../utils/api-response';
import { buildPaginationMeta } from '../utils/pagination';

const router = Router();
const dbService = new DatabaseService();

// Note: authMiddleware is applied at the route level in server.ts
router.get('/', asyncHandler(async (req, res) => {
  const { type, userId, locationId, page, limit } = req.query;
  const filters = { type: type as string, userId: userId as string, locationId: locationId as string, page: page ? parseInt(page as string) : 1, limit: limit ? parseInt(limit as string) : 50 };
  const result = await dbService.getActivityLogs(filters);
  // Wrap items + pagination in a single object so fetchApi returns both fields
  const response = {
    items: result.items,
    pagination: buildPaginationMeta(result.total, result.page, result.limit)
  };
  res.json(apiSuccess(response));
}));

router.post('/', asyncHandler(async (req, res) => {
  const log = await dbService.createActivityLog(req.body);
  res.status(201).json(apiSuccess(log));
}));

export default router;