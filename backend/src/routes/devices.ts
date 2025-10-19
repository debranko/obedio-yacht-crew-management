import { Router } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { requirePermission } from '../middleware/auth';
import { DatabaseService } from '../services/database';

const router = Router();
const dbService = new DatabaseService();

router.get('/', requirePermission('devices.view'), asyncHandler(async (req, res) => {
  const devices = await dbService.getDevices();
  res.json({ success: true, data: devices });
}));

router.post('/', requirePermission('devices.add'), asyncHandler(async (req, res) => {
  const device = await dbService.createDevice(req.body);
  res.status(201).json({ success: true, data: device });
}));

router.put('/:id', requirePermission('devices.edit'), asyncHandler(async (req, res) => {
  const device = await dbService.updateDevice(req.params.id, req.body);
  res.json({ success: true, data: device });
}));

export default router;