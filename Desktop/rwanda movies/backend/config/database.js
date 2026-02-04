const { Sequelize } = require('sequelize');
require('dotenv').config();

// Enhanced database configuration with proper connection handling
const sequelize = new Sequelize(
  process.env.DB_NAME || 'rwanda_movies',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || null,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Enhanced connection pool configuration
    pool: {
      max: 10,          // Reduced max connections to prevent overload
      min: 2,           // Minimum connections always available
      acquire: 30000,   // 30 seconds timeout for acquiring connection
      idle: 10000,      // 10 seconds idle timeout (shorter to prevent stale connections)
      evict: 5000,      // Check for idle connections every 5 seconds
      handleDisconnects: true,
      validate: (connection) => {
        // Custom validation to ensure connection is alive
        return connection && !connection._closing;
      }
    },
    
    // Enhanced dialect options
    dialectOptions: {
      connectTimeout: 30000,    // 30 seconds connection timeout
      acquireTimeout: 30000,    // 30 seconds acquire timeout
      timeout: 30000,           // 30 seconds query timeout
      multipleStatements: false,
      // Enable keep-alive to prevent connection drops
      keepAlive: true,
      keepAliveInitialDelay: 0,
      // Charset configuration
      charset: 'utf8mb4'
    },
    
    // Database table configuration
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      timestamps: true,
      underscored: false
    },
    
    // Enhanced retry configuration
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ESOCKETTIMEDOUT/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /Connection lost/,
        /PROTOCOL_CONNECTION_LOST/
      ],
      max: 5,  // Increased retry attempts
      backoffBase: 1000,  // Start with 1 second delay
      backoffExponent: 2  // Exponential backoff
    },
    
    // Query options
    query: {
      timeout: 30000  // 30 seconds query timeout
    },
    
    // Timezone configuration
    timezone: '+00:00'
  }
);

// Connection event handlers for monitoring
sequelize.addHook('afterConnect', (connection) => {
  console.log('✅ New database connection established');
});

sequelize.addHook('beforeDisconnect', (connection) => {
  console.log('❌ Database connection lost');
});

// Health check function
sequelize.healthCheck = async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query('SELECT 1 as health');
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Graceful shutdown handler
sequelize.gracefulShutdown = async () => {
  try {
    console.log('🔄 Closing database connections...');
    await sequelize.close();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
  }
};

module.exports = sequelize;