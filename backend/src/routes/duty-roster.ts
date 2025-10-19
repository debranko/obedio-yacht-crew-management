import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';

const router = Router();
const dbService = new DatabaseService();

router.get('/assignments', requirePermission('duty.view'), asyncHandler(async (req, res) => {
  const assignments = await dbService.getAssignments(req.query.date as string);
  res.json({ success: true, data: assignments });
}));

router.post('/assignments', requirePermission('duty.manage'), asyncHandler(async (req, res) => {
  const assignment = await dbService.createAssignment(req.body);
  res.status(201).json({ success: true, data: assignment });
}));

export default router;