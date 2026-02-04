const sequelize = require('./config/database');

async function fixIndexes() {
  try {
    // Drop all indexes except primary key
    await sequelize.query('DROP INDEX username ON Users');
    await sequelize.query('DROP INDEX email ON Users');
    
    // Recreate only necessary indexes
    await sequelize.query('CREATE UNIQUE INDEX idx_username ON Users (username)');
    await sequelize.query('CREATE UNIQUE INDEX idx_email ON Users (email)');
    
    console.log('Indexes fixed successfully');
  } catch (error) {
    console.error('Error fixing indexes:', error.message);
  } finally {
    process.exit();
  }
}

fixIndexes();