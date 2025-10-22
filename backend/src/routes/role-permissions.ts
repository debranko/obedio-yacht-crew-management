import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Default permissions for each role
const defaultPermissions = {
  admin: {
    dashboard: { view: true, customize: true },
    serviceRequests: { view: true, create: true, accept: true, complete: true, delete: true },
    guests: { view: true, create: true, edit: true, delete: true },
    crew: { view: true, edit: true, manage: true },
    devices: { view: true, manage: true },
    settings: { view: true, edit: true }
  },
  'chief-stewardess': {
    dashboard: { view: true, customize: true },
    serviceRequests: { view: true, create: true, accept: true, complete: true, delete: false },
    guests: { view: true, create: true, edit: true, delete: false },
    crew: { view: true, edit: false, manage: false },
    devices: { view: true, manage: false },
    settings: { view: true, edit: false }
  },
  stewardess: {
    dashboard: { view: true, customize: true },
    serviceRequests: { view: true, create: true, accept: true, complete: true, delete: false },
    guests: { view: true, create: false, edit: false, delete: false },
    crew: { view: false, edit: false, manage: false },
    devices: { view: true, manage: false },
    settings: { view: false, edit: false }
  },
  crew: {
    dashboard: { view: true, customize: false },
    serviceRequests: { view: false, create: false, accept: false, complete: false, delete: false },
    guests: { view: false, create: false, edit: false, delete: false },
    crew: { view: false, edit: false, manage: false },
    devices: { view: false, manage: false },
    settings: { view: false, edit: false }
  },
  eto: {
    dashboard: { view: true, customize: true },
    serviceRequests: { view: true, create: false, accept: false, complete: false, delete: false },
    guests: { view: false, create: false, edit: false, delete: false },
    crew: { view: true, edit: false, manage: false },
    devices: { view: true, manage: true },
    settings: { view: true, edit: true }
  }
};

// Initialize default permissions if not exists
async function initializeDefaultPermissions() {
  try {
    for (const [role, permissions] of Object.entries(defaultPermissions)) {
      const existing = await prisma.rolePermissions.findUnique({
        where: { role }
      });
      
      if (!existing) {
        await prisma.rolePermissions.create({
          data: {
            role,
            permissions
          }
        });
      }
    }
  } catch (error) {
    console.error('Error initializing default permissions:', error);
  }
}

// Call initialization on startup
initializeDefaultPermissions();

// Get permissions for a specific role
router.get('/roles/:role', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role } = req.params;
    
    let permissions = await prisma.rolePermissions.findUnique({
      where: { role }
    });
    
    // If not found, create default permissions
    if (!permissions && defaultPermissions[role as keyof typeof defaultPermissions]) {
      permissions = await prisma.rolePermissions.create({
        data: {
          role,
          permissions: defaultPermissions[role as keyof typeof defaultPermissions]
        }
      });
    }
    
    if (!permissions) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all role permissions
router.get('/roles', authMiddleware, async (req: Request, res: Response) => {
  try {
    const permissions = await prisma.rolePermissions.findMany();
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching all role permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update permissions for a role (admin only)
router.put('/roles/:role', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can modify permissions' });
    }
    
    const { role } = req.params;
    const { permissions } = req.body;
    
    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Invalid permissions format' });
    }
    
    const updated = await prisma.rolePermissions.update({
      where: { role },
      data: { permissions }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset permissions to defaults for a role (admin only)
router.post('/roles/:role/reset', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reset permissions' });
    }
    
    const { role } = req.params;
    
    if (!defaultPermissions[role as keyof typeof defaultPermissions]) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    const updated = await prisma.rolePermissions.update({
      where: { role },
      data: { permissions: defaultPermissions[role as keyof typeof defaultPermissions] }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error resetting role permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;