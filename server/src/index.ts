import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HealthCheckResponse } from '../../shared/types';
import itemsRouter from './routes/items';
import { testConnection, initDatabase } from './db';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/items', itemsRouter);

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'CozyLife RPG API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      items: '/api/items'
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
