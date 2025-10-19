/**
 * Obedio Yacht Crew Management System - Backend Server
 * Express + TypeScript + Prisma + PostgreSQL + Socket.io
 * Windows Server Ready - Serves Frontend + API + Real-time
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth';
import crewRoutes from './routes/crew';
import guestsRoutes from './routes/guests';
import locationsRoutes from './routes/locations';
import serviceRequestsRoutes from './routes/service-requests';
import devicesRoutes from './routes/devices';
import dutyRosterRoutes from './routes/duty-roster';
import activityLogsRoutes from './routes/activity-logs';
import settingsRoutes from './routes/settings';
import smartButtonRoutes from './routes/smart-buttons';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/logger';

// Import services
import { DatabaseService } from './services/database';
import { RealtimeService } from './services/realtime';
import { Logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io for real-time communication
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Port configuration for Windows server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for IP access

// Initialize services
const logger = new Logger();
const dbService = new DatabaseService();
const realtimeService = new RealtimeService(io);

// ===== MIDDLEWARE SETUP =====

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow Vite HMR in dev
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS setup for frontend communication
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // Alternative frontend port
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});

app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// ===== FRONTEND SERVING =====

// Serve static frontend files from ../dist (Vite build output)
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// ===== API ROUTES =====

app.use('/api/auth', authRoutes);
app.use('/api/crew', authMiddleware, crewRoutes);
app.use('/api/guests', authMiddleware, guestsRoutes);
app.use('/api/locations', authMiddleware, locationsRoutes);
app.use('/api/service-requests', authMiddleware, serviceRequestsRoutes);
app.use('/api/devices', authMiddleware, devicesRoutes);
app.use('/api/duty-roster', authMiddleware, dutyRosterRoutes);
app.use('/api/activity-logs', authMiddleware, activityLogsRoutes);
app.use('/api/settings', authMiddleware, settingsRoutes);
app.use('/api/smart-buttons', authMiddleware, smartButtonRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbService.isConnected ? 'connected' : 'disconnected',
    realtime: realtimeService.isActive ? 'active' : 'inactive'
  });
});

// API status endpoint
app.get('/api/status', authMiddleware, async (req, res) => {
  try {
    const stats = await dbService.getSystemStats();
    res.json({
      ...stats,
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
      },
      realtime: {
        connectedClients: realtimeService.getConnectedCount(),
        totalEvents: realtimeService.getTotalEvents()
      }
    });
  } catch (error) {
    logger.error('Failed to get system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// ===== SPA ROUTING =====

// Catch-all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===== ERROR HANDLING =====

app.use(errorHandler);

// ===== SOCKET.IO REAL-TIME SETUP =====

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Handle authentication
  socket.on('authenticate', async (token: string) => {
    try {
      // Verify JWT token and attach user info to socket
      const user = await dbService.verifyToken(token);
      socket.data.user = user;
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);
      
      logger.info(`User authenticated: ${user.username} (${user.role})`);
      
      // Send initial data
      socket.emit('authenticated', { user: { id: user.id, username: user.username, role: user.role } });
      
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      socket.emit('auth-error', { message: 'Authentication failed' });
      socket.disconnect();
    }
  });
  
  // Handle service request events
  socket.on('service-request:accept', async (data: { requestId: string; crewMemberId: string }) => {
    try {
      const result = await dbService.acceptServiceRequest(data.requestId, data.crewMemberId);
      
      // Broadcast to all connected clients
      io.emit('service-request:updated', result);
      
      logger.info(`Service request ${data.requestId} accepted by ${data.crewMemberId}`);
    } catch (error) {
      logger.error('Failed to accept service request:', error);
      socket.emit('error', { message: 'Failed to accept service request' });
    }
  });
  
  // Handle DND toggle events
  socket.on('dnd:toggle', async (data: { locationId: string; enabled: boolean; guestId?: string }) => {
    try {
      const result = await dbService.toggleDND(data.locationId, data.enabled, data.guestId);
      
      // Broadcast DND status change to all clients
      io.emit('dnd:updated', result);
      
      logger.info(`DND ${data.enabled ? 'enabled' : 'disabled'} for location ${data.locationId}`);
    } catch (error) {
      logger.error('Failed to toggle DND:', error);
      socket.emit('error', { message: 'Failed to toggle DND' });
    }
  });
  
  // Handle smart button press events
  socket.on('smart-button:press', async (data: { 
    deviceId: string; 
    buttonType: 'main' | 'aux1' | 'aux2' | 'aux3' | 'aux4';
    isLongPress?: boolean;
    voiceDuration?: number;
  }) => {
    try {
      const result = await dbService.handleSmartButtonPress(data);
      
      // Broadcast new service request to all clients
      if (result.serviceRequest) {
        io.emit('service-request:new', result.serviceRequest);
      }
      
      // Broadcast DND changes if any
      if (result.dndToggle) {
        io.emit('dnd:updated', result.dndToggle);
      }
      
      logger.info(`Smart button press: ${data.deviceId} - ${data.buttonType}`);
    } catch (error) {
      logger.error('Failed to handle smart button press:', error);
      socket.emit('error', { message: 'Failed to handle button press' });
    }
  });
  
  // Handle crew status changes
  socket.on('crew:status-update', async (data: { crewMemberId: string; status: string }) => {
    try {
      const result = await dbService.updateCrewStatus(data.crewMemberId, data.status);
      
      // Broadcast crew status change
      io.emit('crew:status-changed', result);
      
      logger.info(`Crew status updated: ${data.crewMemberId} → ${data.status}`);
    } catch (error) {
      logger.error('Failed to update crew status:', error);
      socket.emit('error', { message: 'Failed to update crew status' });
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// ===== STARTUP SEQUENCE =====

async function startServer() {
  try {
    // Initialize database connection
    logger.info('Connecting to database...');
    await dbService.connect();
    logger.info('✅ Database connected successfully');
    
    // Initialize realtime service
    realtimeService.initialize();
    logger.info('✅ Real-time service initialized');
    
    // Start HTTP server
    httpServer.listen(PORT, HOST, () => {
      logger.info(`
🚀 Obedio Server Started Successfully!

📍 Server Details:
   • Host: ${HOST}:${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   • Frontend: Served from /dist
   • API: Available at /api/*
   
🌐 Access URLs:
   • Local: http://localhost:${PORT}
   • Network: http://${getLocalIP()}:${PORT}
   
📊 Services Status:
   • Database: ${dbService.isConnected ? '✅ Connected' : '❌ Disconnected'}
   • Real-time: ${realtimeService.isActive ? '✅ Active' : '❌ Inactive'}
   
🔧 Development:
   • API Health: http://localhost:${PORT}/api/health
   • Prisma Studio: npm run db:studio
   
Ready to receive yacht crew management requests! 🛥️
      `);
    });
    
    // Graceful shutdown handlers
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close database connection
  await dbService.disconnect();
  logger.info('Database disconnected');
  
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

// Utility to get local IP for network access
function getLocalIP(): string {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', reason, { promise: promise.toString() });
  process.exit(1);
});

// Start the server
startServer();