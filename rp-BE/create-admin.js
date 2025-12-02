const { pool } = require('./src/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id, username, email, role FROM users WHERE role = $1',
      ['admin']
    );
    
    if (existingAdmin.rows.length > 0) {
      console.log('Admin users already exist:');
      existingAdmin.rows.forEach(user => {
        console.log(`- ${user.username} (${user.email})`);
      });
      return;
    }

    // Create admin user
    const adminEmail = 'admin@returnpoint.com';
    const adminUsername = 'admin';
    const adminPassword = 'admin123'; // Change this in production!

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role`,
      [adminUsername, adminEmail, hashedPassword, 'admin']
    );

    console.log('Admin user created successfully:');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
