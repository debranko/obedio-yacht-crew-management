import { Router, Request, Response } from 'express';
import { prisma } from '../services/db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Get crew change logs with filters
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      limit = 50, 
      offset = 0,
      crewMemberId,
      changeType,
      changedBy,
      startDate,
      endDate,
      search
    } = req.query;
    
    const where: any = {};
    
    if (crewMemberId) {
      where.crewMemberId = crewMemberId as string;
    }
    
    if (changeType) {
      where.changeType = changeType as string;
    }
    
    if (changedBy) {
      where.changedBy = changedBy as string;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    
    // Search in reason field
    if (search) {
      where.OR = [
        { reason: { contains: search as string, mode: 'insensitive' } },
        { oldValue: { contains: search as string, mode: 'insensitive' } },
        { newValue: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    const [logs, total] = await Promise.all([
      prisma.crewChangeLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset)
      }),
      prisma.crewChangeLog.count({ where })
    ]);
    
    // Transform data to match frontend expectations
    const transformedLogs = await Promise.all(logs.map(async (log) => {
      // Get crew member details
      const crewMember = await prisma.crewMember.findUnique({
        where: { id: log.crewMemberId }
      });
      
      // Map changeType to frontend format
      let mappedChangeType = log.changeType;
      if (log.changeType === 'status_change') {
        if (log.newValue === 'on-duty') {
          mappedChangeType = 'added';
        } else if (log.newValue === 'off-duty') {
          mappedChangeType = 'removed';
        }
      }
      
      // Format shift/date info
      const date = log.createdAt.toISOString().split('T')[0];
      const shift = log.fieldName === 'shift' ? log.newValue : 'Day Shift';
      
      return {
        id: log.id,
        crewMember: crewMember?.name || 'Unknown',
        changeType: mappedChangeType,
        date,
        shift,
        details: log.reason || `${log.fieldName}: ${log.oldValue} → ${log.newValue}`,
        performedBy: log.changedBy || 'System',
        timestamp: log.createdAt,
        notified: true // Assume all logged changes were notified
      };
    }));
    
    res.json({
      data: transformedLogs,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching crew change logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create crew change log entry
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      crewMemberId,
      changeType,
      fieldName,
      oldValue,
      newValue,
      reason
    } = req.body;
    
    if (!crewMemberId || !changeType || !fieldName || !newValue) {
      return res.status(400).json({ 
        error: 'crewMemberId, changeType, fieldName, and newValue are required' 
      });
    }
    
    const log = await prisma.crewChangeLog.create({
      data: {
        crewMemberId,
        changeType,
        fieldName,
        oldValue,
        newValue,
        changedBy: userId,
        reason
      }
    });
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating crew change log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs for a specific crew member
router.get('/crew/:crewMemberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { crewMemberId } = req.params;
    const { limit = 20 } = req.query;
    
    const logs = await prisma.crewChangeLog.findMany({
      where: { crewMemberId },
      orderBy: { createdAt: 'desc' },
      take: Number(limit)
    });
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching crew member logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log bulk changes (e.g., from duty roster notifications)
router.post('/bulk', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { changes } = req.body;
    
    if (!Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'changes array is required' });
    }
    
    const logs = await Promise.all(changes.map(async (change: any) => {
      const crewMember = await prisma.crewMember.findFirst({
        where: { name: change.crewMember }
      });
      
      if (!crewMember) {
        console.warn(`Crew member not found: ${change.crewMember}`);
        return null;
      }
      
      // Map frontend change types to backend
      let changeType = 'assignment_change';
      let fieldName = 'assignment';
      let oldValue = null;
      let newValue = change.shift;
      
      switch (change.changeType) {
        case 'added':
          changeType = 'assignment_change';
          newValue = `${change.shift} (Primary)`;
          break;
        case 'removed':
          changeType = 'assignment_change';
          oldValue = change.shift;
          newValue = 'Unassigned';
          break;
        case 'moved_to_primary':
          changeType = 'assignment_change';
          oldValue = `${change.shift} (Backup)`;
          newValue = `${change.shift} (Primary)`;
          break;
        case 'moved_to_backup':
          changeType = 'assignment_change';
          oldValue = `${change.shift} (Primary)`;
          newValue = `${change.shift} (Backup)`;
          break;
      }
      
      return prisma.crewChangeLog.create({
        data: {
          crewMemberId: crewMember.id,
          changeType,
          fieldName,
          oldValue,
          newValue,
          changedBy: userId,
          reason: change.details
        }
      });
    }));
    
    const createdLogs = logs.filter(log => log !== null);
    res.status(201).json(createdLogs);
  } catch (error) {
    console.error('Error creating bulk crew change logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent changes for dashboard
router.get('/recent', authMiddleware, async (req: Request, res: Response) => {
  try {
    const recentLogs = await prisma.crewChangeLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Manually fetch crew member details
    const logsWithCrew = await Promise.all(recentLogs.map(async (log) => {
      const crewMember = await prisma.crewMember.findUnique({
        where: { id: log.crewMemberId },
        select: {
          id: true,
          name: true,
          position: true
        }
      });
      
      return {
        ...log,
        crewMember
      };
    }));
    
    res.json(logsWithCrew);
  } catch (error) {
    console.error('Error fetching recent crew changes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;