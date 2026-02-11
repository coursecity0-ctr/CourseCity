#!/usr/bin/env node

/**
 * Admin User Creation Script
 * 
 * This script creates an admin user in the CourseCity database.
 * Usage:
 *   node create-admin.js <email> <password> [username]
 *   node create-admin.js --prompt
 *   node create-admin.js --user-id <user_id>
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('../config/database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdminUser(email, password, username = null) {
  try {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email address');
    }

    // Validate password
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Generate username if not provided
    if (!username) {
      const baseFromEmail = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]+/g, '_');
      const suffix = Math.random().toString(36).slice(2, 8);
      username = `${baseFromEmail}_${suffix}`;
    }

    // Check if user already exists
    const [existing] = await db.query(
      'SELECT id, email, username, role FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existing.length > 0) {
      const user = existing[0];
      if (user.role === 'admin') {
        console.log('✅ User already exists and is already an admin:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Role: ${user.role}`);
        return;
      }

      // Update existing user to admin
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET password = ?, role = ?, is_active = true WHERE id = ?',
        [hashedPassword, 'admin', user.id]
      );
      console.log('✅ Existing user updated to admin:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      return;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, role, is_active, auth_provider)
       VALUES (?, ?, ?, 'admin', true, 'local')`,
      [username, email, hashedPassword]
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Role: admin`);
    console.log('\n📝 You can now log in with these credentials.');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

async function promoteUserToAdmin(userId) {
  try {
    const [users] = await db.query('SELECT id, email, username, role FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const user = users[0];
    
    if (user.role === 'admin') {
      console.log('✅ User is already an admin:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      return;
    }

    await db.query(
      'UPDATE users SET role = ?, is_active = true WHERE id = ?',
      ['admin', userId]
    );

    console.log('✅ User promoted to admin successfully!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: admin (updated)`);
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
    process.exit(1);
  }
}

async function promptMode() {
  console.log('\n🔐 Create Admin User\n');
  
  const email = await question('Enter email address: ');
  if (!email) {
    console.error('❌ Email is required');
    process.exit(1);
  }

  const password = await question('Enter password: ');
  if (!password) {
    console.error('❌ Password is required');
    process.exit(1);
  }

  const username = await question('Enter username (optional, press Enter to auto-generate): ');
  
  await createAdminUser(email, password, username || null);
}

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length === 0 || args[0] === '--prompt' || args[0] === '-p') {
      await promptMode();
    } else if (args[0] === '--user-id' || args[0] === '-u') {
      const userId = args[1];
      if (!userId) {
        console.error('❌ User ID is required');
        console.log('Usage: node create-admin.js --user-id <user_id>');
        process.exit(1);
      }
      await promoteUserToAdmin(parseInt(userId));
    } else {
      const email = args[0];
      const password = args[1];
      const username = args[2] || null;

      if (!email || !password) {
        console.error('❌ Email and password are required');
        console.log('\nUsage:');
        console.log('  node create-admin.js <email> <password> [username]');
        console.log('  node create-admin.js --prompt');
        console.log('  node create-admin.js --user-id <user_id>');
        process.exit(1);
      }

      await createAdminUser(email, password, username);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await db.end();
    process.exit(0);
  }
}

main();

