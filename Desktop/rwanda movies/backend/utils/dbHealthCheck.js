const sequelize = require('../config/database');

class DatabaseHealthCheck {
  static async checkConnection() {
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  static async getConnectionPoolStatus() {
    const pool = sequelize.connectionManager.pool;
    return {
      size: pool.size,
      available: pool.available,
      using: pool.using,
      waiting: pool.waiting
    };
  }

  static async closeAllConnections() {
    try {
      await sequelize.close();
      console.log('✅ All database connections closed');
    } catch (error) {
      console.error('❌ Error closing connections:', error.message);
    }
  }

  static async testQuery() {
    try {
      const startTime = Date.now();
      const result = await sequelize.query('SELECT 1 as test', { type: sequelize.QueryTypes.SELECT });
      const duration = Date.now() - startTime;
      console.log(`✅ Test query successful (${duration}ms)`);
      return { success: true, duration, result };
    } catch (error) {
      console.error('❌ Test query failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DatabaseHealthCheck;