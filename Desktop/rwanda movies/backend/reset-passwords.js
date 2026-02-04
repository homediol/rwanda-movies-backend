const bcrypt = require('bcryptjs');
const User = require('./models/User');
const sequelize = require('./config/database');

async function resetPasswords() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Reset all user passwords to 'password123'
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await User.update(
      { password: hashedPassword },
      { 
        where: {},
        hooks: false // Skip model hooks to prevent double hashing
      }
    );

    console.log('All user passwords have been reset to: password123');
    console.log('You can now log in with any user using password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPasswords();