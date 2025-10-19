import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';

const router = Router();
const dbService = new DatabaseService();

router.post('/press', asyncHandler(async (req, res) => {
  const result = await dbService.handleSmartButtonPress(req.body);
  res.json({ success: true, data: result });
}));

export default router;