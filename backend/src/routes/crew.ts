/**
 * Crew Management API Routes
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('crew.view'), asyncHandler(async (req, res) => {
  const crew = await dbService.getCrewMembers();
  res.json({ success: true, data: crew });
}));

router.post('/', requirePermission('crew.add'), asyncHandler(async (req, res) => {
  const crew = await dbService.createCrewMember(req.body);
  res.status(201).json({ success: true, data: crew });
}));

router.put('/:id', requirePermission('crew.edit'), asyncHandler(async (req, res) => {
  const crew = await dbService.updateCrewMember(req.params.id, req.body);
  res.json({ success: true, data: crew });
}));

export default router;