import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Auth required' });
  try {
    const token = h.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    (req as any).user = { id: payload.sub, role: payload.role, username: payload.username };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}