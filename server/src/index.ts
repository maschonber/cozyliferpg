import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HealthCheckResponse } from '../../shared/types';
import npcsRouter from './routes/npcs';
import relationshipsRouter from './routes/relationships';
import playerRouter from './routes/player';
import activitiesRouter from './routes/activities';
import locationsRouter from './routes/locations';
import adminRouter from './routes/admin';
import authRouter from './auth/auth.routes';
import { authenticateToken } from './auth/auth.middleware';
import { testConnection, initDatabase, seedDatabase, seedUsers, migratePhase3Locations, migratePhase25Stats } from './db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:4200',
  'https://maschonber.github.io'
];

// Add custom FRONTEND_URL if provided
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Public routes (no authentication required)
// Health check endpoint
app.get('/api/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Authentication routes (public)
app.use('/api/auth', authRouter);

// Admin routes (token-based auth, not JWT)
app.use('/api/admin', adminRouter);

// Protected routes (authentication required)
// API Routes - all protected
app.use('/api/npcs', authenticateToken, npcsRouter);
app.use('/api/relationships', authenticateToken, relationshipsRouter);
app.use('/api/player', authenticateToken, playerRouter);
app.use('/api/activities', authenticateToken, activitiesRouter);
app.use('/api/locations', authenticateToken, locationsRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'CozyLife RPG API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      npcs: '/api/npcs (protected)',
      relationships: '/api/relationships (protected)',
      activities: '/api/activities (protected)',
      player: '/api/player (protected)',
      locations: '/api/locations (protected)'
    }
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    if (process.env.DATABASE_URL) {
      console.log('🔌 Connecting to database...');
      const connected = await testConnection();

      if (connected) {
        console.log('📊 Initializing database schema...');
        await initDatabase();
        console.log('🌱 Checking for seed data...');
        await seedDatabase();
        console.log('👤 Checking for initial user...');
        await seedUsers();
        console.log('🗺️  Running Phase 3 migration...');
        await migratePhase3Locations();
        console.log('📊 Running Phase 2.5 stats migration...');
        await migratePhase25Stats();
      } else {
        console.warn('⚠️  Database connection failed, but server will start anyway');
      }
    } else {
      console.warn('⚠️  No DATABASE_URL provided, skipping database initialization');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    console.log('⚠️  Server will start without database');
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 CozyLife RPG API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
  });
}

startServer();
