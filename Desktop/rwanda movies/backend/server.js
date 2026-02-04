const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const categoryRoutes = require('./routes/categories');
const interactionRoutes = require('./routes/interactions');
const userRoutes = require('./routes/users');

const app = express();

// Global error handlers for unhandled promises and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Graceful shutdown
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Graceful shutdown function
const gracefulShutdown = async (signal) => {
  console.log(`🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close database connections
    await sequelize.gracefulShutdown();
    
    // Close server
    if (server) {
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Cookie parser
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/users', userRoutes);

// Enhanced health check with database status
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await sequelize.healthCheck();
    const memoryUsage = process.memoryUsage();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealth,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database connection monitoring endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    const health = await sequelize.healthCheck();
    const connectionCount = sequelize.connectionManager.pool.size;
    const idleConnections = sequelize.connectionManager.pool.available.length;
    const activeConnections = sequelize.connectionManager.pool.used.length;
    
    res.json({
      ...health,
      connections: {
        total: connectionCount,
        active: activeConnections,
        idle: idleConnections
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
    
  res.status(err.status || 500).json({ 
    message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Database connection with retry logic
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Attempting database connection (attempt ${i + 1}/${retries})...`);
      
      await sequelize.authenticate();
      console.log('✅ Connected to MySQL database');
      
      await sequelize.sync({ alter: false }); // Changed to false to prevent schema changes
      console.log('✅ Database synchronized');
      
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Start server with proper error handling
let server;

const startServer = async () => {
  try {
    // Connect to database first
    await connectWithRetry();
    
    // Start HTTP server
    const PORT = process.env.PORT || 5001;
    server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 DB status: http://localhost:${PORT}/api/db-status`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Periodic health checks (every 5 minutes)
setInterval(async () => {
  try {
    const health = await sequelize.healthCheck();
    if (health.status !== 'healthy') {
      console.warn('⚠️ Database health check failed:', health);
    }
  } catch (error) {
    console.error('❌ Health check error:', error.message);
  }
}, 5 * 60 * 1000);

// Memory usage monitoring (every 10 minutes)
setInterval(() => {
  const memoryUsage = process.memoryUsage();
  const memoryMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024)
  };
  
  console.log('📊 Memory usage:', memoryMB);
  
  // Alert if memory usage is high (over 500MB)
  if (memoryMB.heapUsed > 500) {
    console.warn('⚠️ High memory usage detected:', memoryMB);
  }
}, 10 * 60 * 1000);