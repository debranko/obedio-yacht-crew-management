import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { prisma } from './services/db';
import { websocketService } from './services/websocket';

// Import routes
import authRoutes from './routes/auth';
import crewRoutes from './routes/crew';
import locationRoutes from './routes/locations';
import guestRoutes from './routes/guests';
import transcribeRoutes from './routes/transcribe';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware - Allow all origins for development
app.use(cors({ 
  origin: true, // Allow any origin in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/transcribe', transcribeRoutes);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Initialize WebSocket server
    websocketService.initialize(httpServer);
    console.log('✅ WebSocket server initialized');
    
    httpServer.listen(PORT, () => {
      console.log(`
🚀 Obedio Server Started Successfully!

📍 Server Details:
   • Host: localhost:${PORT}
   • Environment: ${process.env.NODE_ENV || 'development'}
   
🌐 Access URLs:
   • API Health: http://localhost:${PORT}/api/health
   • Auth: http://localhost:${PORT}/api/auth/login
   • WebSocket: ws://localhost:${PORT}
   
📊 Available Endpoints:
   • GET /api/crew - List crew members
   • GET /api/locations - List locations
   • GET /api/guests - List guests
   • POST /api/auth/login - Login (admin/admin123)
   
🔧 Development:
   • Database: PostgreSQL connected
   • WebSocket: Real-time events enabled ⚡
   • Seed data: Use 'npm run db:seed'
   
Ready to receive yacht crew management requests! 🛥️
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
