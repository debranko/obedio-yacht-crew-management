import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';

const router = Router();

router.get('/', requirePermission('system.settings'), asyncHandler(async (req, res) => {
  res.json({ success: true, data: { message: 'Settings endpoint' } });
}));

export default router;