import { Router } from 'express';
import { prisma } from '../services/db';
const r = Router();

r.get('/', async (_, res) => {
  const data = await prisma.crewMember.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, data });
});

r.post('/', async (req, res) => {
  const { name, position, department, status, contact, email, joinDate, role } = req.body ?? {};
  const created = await prisma.crewMember.create({
    data: {
      name, position, department,
      status: status ?? 'active',
      contact: contact ?? null,
      email: email ?? null,
      joinDate: joinDate ? new Date(joinDate) : null,
      role: role ?? null
    }
  });
  res.json({ success: true, data: created });
});

export default r;