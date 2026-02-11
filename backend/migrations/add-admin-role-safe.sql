-- Migration: Add admin role and is_active field to users table (Safe Version)
-- This version checks if columns exist before adding them
-- Run this in phpMyAdmin or MySQL client if you have an existing database

USE coursecity;

-- Check and add role column
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'role';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'user\', \'admin\', \'moderator\') DEFAULT \'user\' AFTER provider_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add is_active column
SET @columnname = 'is_active';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1', -- Column exists, do nothing
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT TRUE AFTER role')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add indexes (will error if they exist, but that's okay)
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE users ADD INDEX idx_active (is_active);

-- Update all existing users to have 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Set all existing users as active (if not already set)
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

