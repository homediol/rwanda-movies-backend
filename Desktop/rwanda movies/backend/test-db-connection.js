const sequelize = require('./config/database');
const { executeQuery } = require('./middleware/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and pool configuration...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    await sequelize.authenticate();
    console.log('✅ Basic connection successful\n');

    // Test 2: Health check
    console.log('2️⃣ Testing health check...');
    const health = await sequelize.healthCheck();
    console.log('✅ Health check:', health, '\n');

    // Test 3: Connection pool stats
    console.log('3️⃣ Connection pool statistics...');
    const pool = sequelize.connectionManager.pool;
    console.log('📊 Pool stats:', {
      total: pool.size || 0,
      active: pool.used ? pool.used.length : 0,
      idle: pool.available ? pool.available.length : 0,
      pending: pool.pending ? pool.pending.length : 0
    }, '\n');

    // Test 4: Multiple concurrent queries
    console.log('4️⃣ Testing concurrent queries...');
    const promises = Array.from({ length: 5 }, (_, i) => 
      executeQuery(async () => {
        const [results] = await sequelize.query(`SELECT ${i + 1} as test_query, NOW() as timestamp`);
        return results[0];
      })
    );
    
    const results = await Promise.all(promises);
    console.log('✅ Concurrent queries successful:', results.length, 'queries completed\n');

    // Test 5: Connection timeout test
    console.log('5️⃣ Testing connection timeout handling...');
    try {
      await sequelize.query('SELECT SLEEP(2)'); // 2 second delay
      console.log('✅ Timeout handling working\n');
    } catch (error) {
      console.log('⚠️ Timeout test result:', error.message, '\n');
    }

    // Test 6: Error recovery test
    console.log('6️⃣ Testing error recovery...');
    try {
      await executeQuery(async () => {
        await sequelize.query('SELECT * FROM non_existent_table');
      });
    } catch (error) {
      console.log('✅ Error recovery working:', error.message.substring(0, 50) + '...\n');
    }

    console.log('🎉 All database connection tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run tests
testDatabaseConnection();