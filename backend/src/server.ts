import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createHttpsServer } from 'https';
import { createServer as createHttpServer } from 'http';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { prisma } from './services/db';
import { websocketService } from './services/websocket';
import { mqttService } from './services/mqtt.service';
import { mqttMonitor } from './services/mqtt-monitor';
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import crewRoutes from './routes/crew';
import locationRoutes from './routes/locations';
import guestRoutes from './routes/guests';
import transcribeRoutes from './routes/transcribe';
import deviceRoutes from './routes/devices';
import userPreferencesRoutes from './routes/user-preferences';
import serviceRequestRoutes from './routes/service-requests';
import yachtSettingsRoutes from './routes/yacht-settings';
import rolePermissionsRoutes from './routes/role-permissions';
import notificationSettingsRoutes from './routes/notification-settings';
import messagesRoutes from './routes/messages';
import serviceRequestHistoryRoutes from './routes/service-request-history';
import crewChangeLogsRoutes from './routes/crew-change-logs';
import activityLogsRoutes from './routes/activity-logs';
import settingsRoutes from './routes/settings';
import smartButtonsRoutes from './routes/smart-buttons';
import dashboardRoutes from './routes/dashboard';
import serviceCategoriesRoutes from './routes/service-categories';
import uploadRoutes from './routes/upload';
import deviceDiscoveryRoutes from './routes/device-discovery';
import shiftsRoutes from './routes/shifts';
import assignmentsRoutes from './routes/assignments';
import systemSettingsRoutes from './routes/system-settings';
import backupRoutes from './routes/backup';
import path from 'path';

dotenv.config();

const app = express();
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../.cert-key-private.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../.cert-key.pem')),
};

// HTTPS server for web/mobile clients (port 8080)
const httpsServer = createHttpsServer(httpsOptions, app);

// HTTP server for ESP32 devices (port 8081) - ESP32 doesn't support TLS easily
const httpServer = createHttpServer(app);

const PORT = parseInt(process.env.PORT || '8080', 10);
const HTTP_PORT = 8081;  // Plain HTTP for ESP32 devices

// Security Headers - Helmet protects against common vulnerabilities
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"], // Allow fonts for Swagger UI
    },
  },
  crossOriginEmbedderPolicy: false, // Allow WebSocket connections
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow CORS
}));

// CORS Configuration - Secure for production
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Protect against brute force attacks
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 min per IP
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter removed - no rate limiting on login for development

// Bypass rate limiting for upload routes (ESP32 large file uploads)
app.use('/api/upload', (req, res, next) => next());

// Apply global rate limiter to all API routes
app.use('/api/', globalLimiter);

// Parse cookies for HTTP-only token storage (server runs 24/7)
app.use(cookieParser());

app.use(express.json({ limit: '10mb' })); // Increase JSON payload limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Increase URL-encoded payload limit

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'OBEDIO API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  customfavIcon: '/favicon.ico',
}));

// Swagger JSON endpoint for programmatic access
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes - Apply strict rate limiting to auth endpoints
app.use('/api/auth', authRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/locations', authMiddleware, locationRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/user-preferences', userPreferencesRoutes);
app.use('/api/service-requests', authMiddleware, serviceRequestRoutes);
app.use('/api/yacht-settings', yachtSettingsRoutes);
app.use('/api/permissions', rolePermissionsRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/service-request-history', serviceRequestHistoryRoutes);
app.use('/api/crew-change-logs', authMiddleware, crewChangeLogsRoutes);
app.use('/api/activity-logs', authMiddleware, activityLogsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/smart-buttons', smartButtonsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/service-categories', serviceCategoriesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/device-discovery', deviceDiscoveryRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/backup', backupRoutes);

// 404 handler (must come before error handler)
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler (must be last!)
app.use(errorHandler);

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Initialize WebSocket server on HTTPS server
    websocketService.initialize(httpsServer);
    console.log('✅ WebSocket server initialized');

    // Initialize MQTT service
    await mqttService.connect(websocketService.getIO());
    console.log('✅ MQTT service connected');

    // Start MQTT Monitor Dashboard
    mqttMonitor.start();

    // Configure HTTP server timeouts for large ESP32 uploads
    httpServer.setTimeout(300000);  // 5 minutes for large audio uploads
    httpServer.keepAliveTimeout = 65000;
    httpServer.headersTimeout = 66000;

    // Start HTTPS server on port 8080 (for web/mobile clients)
    httpsServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ HTTPS server listening on port ${PORT}`);
    });

    // Start HTTP server on port 8081 (for ESP32 devices)
    httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
      console.log(`✅ HTTP server listening on port ${HTTP_PORT} (for ESP32)`);
    });

    console.log(`
🚀 Obedio Server Started Successfully!

📍 Server Details:
   • HTTPS: 0.0.0.0:${PORT} (web/mobile clients)
   • HTTP:  0.0.0.0:${HTTP_PORT} (ESP32 devices)
   • Network: 10.10.0.207
   • Environment: ${process.env.NODE_ENV || 'development'}

🌐 Access URLs:
   • API Health: https://localhost:${PORT}/api/health
   • Auth: https://localhost:${PORT}/api/auth/login
   • WebSocket: wss://localhost:${PORT}
   • MQTT Monitor: http://localhost:${process.env.MQTT_MONITOR_PORT || 8889}
   • API Docs: https://localhost:${PORT}/api-docs 📚

📱 Wear OS Access:
   • API: https://10.10.0.207:${PORT}/api
   • WebSocket: wss://10.10.0.207:${PORT}

🔌 ESP32 Access (Plain HTTP):
   • API: http://10.10.0.207:${HTTP_PORT}/api
   • Audio Upload: http://10.10.0.207:${HTTP_PORT}/api/upload/upload-audio

📊 Available Endpoints:
   • GET /api/crew - List crew members
   • GET /api/locations - List locations
   • GET /api/guests - List guests
   • GET /api/service-requests - List service requests
   • POST /api/auth/login - Login (admin/admin123)

🔧 Development:
   • Database: PostgreSQL connected
   • WebSocket: Real-time events enabled ⚡
   • MQTT: ESP32 integration ready 📡
   • Seed data: Use 'npm run db:seed'

Ready to receive yacht crew management requests! 🛥️
    `);

    // ═══════════════════════════════════════════════════════════════════════
    // AUTO-ARCHIVE: Scheduled job to clean up old completed service requests
    // ═══════════════════════════════════════════════════════════════════════
    async function runAutoArchive() {
      try {
        // Fetch admin user preferences for auto-archive setting
        const adminPrefs = await prisma.userPreferences.findFirst({
          where: {
            user: { role: 'ADMIN' }
          }
        });

        const archiveMinutes = adminPrefs?.serviceRequestAutoArchive || 30;
        if (archiveMinutes === 0) return; // Auto-archive is disabled

        const cutoffTime = new Date(Date.now() - archiveMinutes * 60 * 1000);

        // Delete completed requests older than the cutoff time
        const deleted = await prisma.serviceRequest.deleteMany({
          where: {
            status: 'completed',
            completedAt: { lt: cutoffTime }
          }
        });

        if (deleted.count > 0) {
          console.log(`🗑️ Auto-archived ${deleted.count} completed service request(s) older than ${archiveMinutes} minutes`);

          // Broadcast to WebSocket so UI updates
          websocketService.getIO()?.emit('service-requests:archived', {
            count: deleted.count,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('❌ Auto-archive error:', error);
      }
    }

    // Run auto-archive every minute
    setInterval(runAutoArchive, 60 * 1000);
    console.log('✅ Auto-archive scheduler started (runs every 60s)');

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
