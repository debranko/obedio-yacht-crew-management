import { Router } from 'express';
import { prisma } from '../services/db';
const r = Router();

r.get('/', async (_, res) => {
  const data = await prisma.location.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data });
});

export default r;