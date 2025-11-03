/**
 * Database Service - Prisma ORM wrapper for all database operations
 * Handles all CRUD operations, relationships, and transactions
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Logger } from '../utils/logger';

const logger = new Logger();

export class DatabaseService {
  public prisma: PrismaClient; // Make public for route access
  public isConnected: boolean = false;

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      logger.error('Database connection failed', error);
      throw error;
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Database disconnection failed', error);
      throw error;
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const [
      usersCount,
      crewCount,
      guestsCount,
      locationsCount,
      activeServiceRequests,
      devicesCount
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.crewMember.count(),
      this.prisma.guest.count(),
      this.prisma.location.count(),
      this.prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.device.count()
    ]);

    return {
      users: usersCount,
      crew: crewCount,
      guests: guestsCount,
      locations: locationsCount,
      activeServiceRequests,
      devices: devicesCount,
      timestamp: new Date().toISOString()
    };
  }

  // ===== AUTHENTICATION =====

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  }) {
    const hashedPassword = await bcrypt.hash(userData.password, parseInt(process.env.BCRYPT_ROUNDS || '12'));
    
    return this.prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        role: userData.role as any || 'CREW',
        firstName: userData.firstName,
        lastName: userData.lastName
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    });
  }

  async authenticateUser(username: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ],
        isActive: true
      }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    const payload = { userId: user.id, username: user.username, role: user.role };
    const options: SignOptions = { expiresIn: (process.env.AUTH_EXPIRES_IN || '7d') as string };
    const token = jwt.sign(payload, secret, options);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      token
    };
  }

  async verifyToken(token: string) {
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }
      
      const decoded = jwt.verify(token, secret) as any;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId, isActive: true },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // ===== CREW MANAGEMENT =====

  async getCrewMembers() {
    return this.prisma.crewMember.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true
          }
        },
        deviceAssignments: {
          include: {
            device: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createCrewMember(data: any) {
    return this.prisma.crewMember.create({
      data,
      include: { user: true }
    });
  }

  async updateCrewMember(id: string, data: any) {
    return this.prisma.crewMember.update({
      where: { id },
      data,
      include: { user: true }
    });
  }

  async updateCrewStatus(crewMemberId: string, status: string) {
    const updated = await this.prisma.crewMember.update({
      where: { id: crewMemberId },
      data: { status: status as any },
      include: { user: true }
    });

    // Log status change
    await this.prisma.activityLog.create({
      data: {
        type: 'CREW',
        action: `Status changed to ${status}`,
        details: `Crew member ${updated.name} status updated to ${status}`,
        userId: updated.userId
      }
    });

    return updated;
  }

  // ===== GUEST MANAGEMENT =====

  async getGuests(filters?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.status && filters.status !== 'All') {
      where.status = filters.status.toUpperCase();
    }
    
    if (filters?.type && filters.type !== 'All') {
      where.type = filters.type.toUpperCase();
    }
    
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { cabin: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        include: {
          location: true,
          serviceRequests: {
            where: { status: 'PENDING' },
            take: 5
          }
        },
        orderBy: { firstName: 'asc' },
        skip,
        take: limit
      }),
      this.prisma.guest.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createGuest(data: any) {
    return this.prisma.guest.create({
      data,
      include: { location: true }
    });
  }

  async updateGuest(id: string, data: any) {
    return this.prisma.guest.update({
      where: { id },
      data,
      include: { location: true }
    });
  }

  async deleteGuest(id: string) {
    return this.prisma.guest.delete({
      where: { id }
    });
  }

  // ===== LOCATION MANAGEMENT =====

  async getLocations() {
    return this.prisma.location.findMany({
      include: {
        guests: {
          where: { status: 'ONBOARD' }
        },
        devices: true,
        _count: {
          select: {
            serviceRequests: {
              where: { status: 'PENDING' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createLocation(data: any) {
    return this.prisma.location.create({
      data,
      include: { guests: true, devices: true }
    });
  }

  async updateLocation(id: string, data: any) {
    return this.prisma.location.update({
      where: { id },
      data,
      include: { guests: true, devices: true }
    });
  }

  async deleteLocation(id: string) {
    return this.prisma.location.delete({
      where: { id }
    });
  }

  // ===== ATOMIC DND OPERATIONS =====

  async toggleDND(locationId: string, enabled: boolean, guestId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Update location
      const location = await tx.location.update({
        where: { id: locationId },
        data: { doNotDisturb: enabled },
        include: { guests: true }
      });

      // Update guest if provided
      let guest: any = null;
      if (guestId) {
        guest = await tx.guest.update({
          where: { id: guestId },
          data: { doNotDisturb: enabled }
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          type: 'DND',
          action: enabled ? 'DND Activated' : 'DND Deactivated',
          locationId: location.id,
          guestId: guest?.id || null,
          details: `DND ${enabled ? 'enabled' : 'disabled'} for ${location.name}${guest ? ` (${guest.firstName} ${guest.lastName})` : ''}`
        }
      });

      return { location, guest };
    });
  }

  // ===== SERVICE REQUEST MANAGEMENT =====

  async getServiceRequests(filters?: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    
    if (filters?.status && filters.status !== 'All') {
      where.status = filters.status.toUpperCase();
    }
    
    if (filters?.priority && filters.priority !== 'All') {
      where.priority = filters.priority.toUpperCase();
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 25;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        include: {
          guest: true,
          location: true,
          category: true,
          CrewMember: true  // Include assigned crew member details
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.serviceRequest.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createServiceRequest(data: any) {
    return this.prisma.serviceRequest.create({
      data,
      include: {
        guest: true,
        location: true,
        category: true,
        CrewMember: true  // Include assigned crew member details
      }
    });
  }

  async acceptServiceRequest(requestId: string, crewMemberId: string) {
    // First get the crew member to get their name
    const crewMember = await this.prisma.crewMember.findUnique({
      where: { id: crewMemberId }
    });

    if (!crewMember) {
      throw new Error('Crew member not found');
    }

    // Get the service request to populate guest info
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        guest: true,
        location: true
      }
    });

    if (!request) {
      throw new Error('Service request not found');
    }

    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        assignedTo: crewMember.name,  // Store crew member name as string
        assignedToId: crewMemberId,   // Store crew member ID
        acceptedAt: new Date(),
        guestName: request.guest ? `${request.guest.firstName} ${request.guest.lastName}` : null,
        guestCabin: request.location?.name || null
      },
      include: {
        guest: true,
        location: true,
        category: true,
        CrewMember: true  // Include assigned crew member details
      }
    });
  }

  async completeServiceRequest(requestId: string) {
    const request = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        guest: true,
        location: true,
        category: true,
        CrewMember: true  // Include assigned crew member details
      }
    });

    // Create history record
    if (request.acceptedAt) {
      const responseTime = Math.floor((request.acceptedAt.getTime() - request.createdAt.getTime()) / 1000);
      const completionTime = Math.floor((request.completedAt!.getTime() - request.acceptedAt.getTime()) / 1000);

      await this.prisma.serviceRequestHistory.create({
        data: {
          originalRequestId: request.id,
          action: 'completed',
          newStatus: 'COMPLETED',
          completedBy: request.assignedTo || 'Unknown',
          completedAt: request.completedAt!,
          responseTime,
          completionTime,
          guestName: request.guestName,
          location: request.location?.name || request.guestCabin || null,
          requestType: request.requestType,
          priority: request.priority
        }
      });

      // Log to activity log
      await this.prisma.activityLog.create({
        data: {
          type: 'service_request',
          action: 'Request Completed',
          details: `${request.assignedTo || 'Crew'} completed service request from ${request.guest ? request.guest.firstName + ' ' + request.guest.lastName : request.guestName || 'Guest'} at ${request.location?.name || request.guestCabin || 'Unknown'}`,
          userId: request.CrewMember?.userId || null,
          locationId: request.locationId,
          guestId: request.guestId,
          metadata: JSON.stringify({
            requestId: request.id,
            requestType: request.requestType,
            priority: request.priority,
            responseTimeSec: responseTime,
            completionTimeSec: completionTime,
            totalTimeSec: responseTime + completionTime
          })
        }
      });
    }

    return request;
  }

  async deleteAllServiceRequests() {
    // Delete all service request history first (foreign key constraint)
    await this.prisma.serviceRequestHistory.deleteMany({});

    // Delete all service requests
    const result = await this.prisma.serviceRequest.deleteMany({});

    return result;
  }

  // ===== SMART BUTTON INTEGRATION =====

  async handleSmartButtonPress(data: {
    deviceId: string;
    buttonType: 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4';
    isLongPress?: boolean;
    voiceDuration?: number;
  }) {
    // Find device and its location
    const device = await this.prisma.device.findUnique({
      where: { deviceId: data.deviceId }
    });

    if (!device || device.type !== 'smart_button') {
      throw new Error('Smart button device not found');
    }

    const location = await this.prisma.location.findFirst({
      where: { smartButtonId: device.deviceId },
      include: { guests: { where: { status: 'ONBOARD' } } }
    });

    if (!location) {
      throw new Error('Location not found for smart button');
    }

    const result: any = {};

    // Handle different button functions based on device config
    const config = device.config as any || {};
    
    switch (data.buttonType) {
      case 'main':
        // Main button - create service request
        const guest = location.guests[0]; // Primary guest in location
        
        const serviceRequest = await this.prisma.serviceRequest.create({
          data: {
            guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Guest',
            guestCabin: location.name,
            cabinId: location.id,
            locationId: location.id,
            guestId: guest?.id,
            requestType: 'CALL',
            priority: 'NORMAL',
            voiceTranscript: data.isLongPress
              ? `Voice message (${data.voiceDuration?.toFixed(1)}s): Service request`
              : undefined,
            notes: `Smart button press - ${data.isLongPress ? 'Long press (voice)' : 'Quick tap'}`
          },
          include: {
            guest: true,
            location: true
          }
        });

        result.serviceRequest = serviceRequest;
        break;

      case 'aux1':
        // DND Toggle (based on button configuration)
        if (config.auxButton1Function === 'dnd_toggle') {
          const newDNDState = !location.doNotDisturb;
          result.dndToggle = await this.toggleDND(location.id, newDNDState, location.guests[0]?.id);
        }
        break;

      default:
        // Other aux buttons - create specific service requests
        const functionMap: Record<string, string> = {
          aux2: config.auxButton2Function,
          aux3: config.auxButton3Function,
          aux4: config.auxButton4Function
        };

        const requestFunction = functionMap[data.buttonType];
        if (requestFunction) {
          // Create service request based on button function
          // This would be expanded based on specific button functions
        }
        break;
    }

    // Update device last seen
    await this.prisma.device.update({
      where: { id: device.id },
      data: { lastSeen: new Date() }
    });

    return result;
  }

  // ===== ACTIVITY LOGS =====

  async getActivityLogs(filters?: {
    type?: string;
    userId?: string;
    locationId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters?.type) {
      where.type = filters.type; // Keep lowercase - logs are stored in lowercase
    }

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.locationId) {
      where.locationId = filters.locationId;
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, username: true }
          },
          location: {
            select: { id: true, name: true }
          },
          guest: {
            select: { id: true, firstName: true, lastName: true }
          },
          device: {
            select: { id: true, name: true }
          }
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.activityLog.count({ where })
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createActivityLog(data: any) {
    return this.prisma.activityLog.create({
      data
    });
  }

  // ===== DEVICE MANAGEMENT =====

  async getDevices() {
    return this.prisma.device.findMany({
      include: {
        location: true,
        assignments: {
          include: {
            crewMember: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async createDevice(data: any) {
    return this.prisma.device.create({
      data,
      include: {
        location: true,
        assignments: true
      }
    });
  }

  async updateDevice(id: string, data: any) {
    return this.prisma.device.update({
      where: { id },
      data,
      include: {
        location: true,
        assignments: true
      }
    });
  }

  // ===== ADDITIONAL HELPER METHODS =====

  async getLocationById(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
      include: {
        guests: { where: { status: 'ONBOARD' } },
        devices: true,
        serviceRequests: {
          where: { status: 'PENDING' },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async getDNDLocations() {
    return this.prisma.location.findMany({
      where: { doNotDisturb: true },
      include: {
        guests: { where: { status: 'ONBOARD' } }
      },
      orderBy: { name: 'asc' }
    });
  }
}