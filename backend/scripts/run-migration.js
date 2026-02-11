#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds role and is_active columns to users table
 */

require('dotenv').config();
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Check if columns already exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('role', 'is_active')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // Add role column if it doesn't exist
    if (!existingColumns.includes('role')) {
      console.log('📝 Adding role column...');
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN role ENUM('user', 'admin', 'moderator') DEFAULT 'user' AFTER provider_id
      `);
      console.log('✅ Role column added successfully');
    } else {
      console.log('✅ Role column already exists');
    }

    // Add is_active column if it doesn't exist
    if (!existingColumns.includes('is_active')) {
      console.log('📝 Adding is_active column...');
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER role
      `);
      console.log('✅ is_active column added successfully');
    } else {
      console.log('✅ is_active column already exists');
    }

    // Add indexes
    console.log('📝 Adding indexes...');
    try {
      await db.query('ALTER TABLE users ADD INDEX idx_role (role)');
      console.log('✅ idx_role index added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ idx_role index already exists');
      } else {
        throw error;
      }
    }

    try {
      await db.query('ALTER TABLE users ADD INDEX idx_active (is_active)');
      console.log('✅ idx_active index added');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ idx_active index already exists');
      } else {
        throw error;
      }
    }

    // Update existing users
    console.log('📝 Updating existing users...');
    const [updateRole] = await db.query(`UPDATE users SET role = 'user' WHERE role IS NULL`);
    const [updateActive] = await db.query('UPDATE users SET is_active = TRUE WHERE is_active IS NULL');
    console.log(`✅ Updated ${updateRole.affectedRows} users with default role`);
    console.log(`✅ Updated ${updateActive.affectedRows} users with active status`);

    console.log('\n✨ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   Run: node scripts/create-admin.js --prompt');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    process.exit(1);
  } finally {
    await db.end();
  }
}

runMigration();

