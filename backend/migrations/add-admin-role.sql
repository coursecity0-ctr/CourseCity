-- Migration: Add admin role and is_active field to users table
-- Run this in phpMyAdmin or MySQL client if you have an existing database

USE coursecity;

-- Add role column (will error if column already exists - that's okay, just continue)
ALTER TABLE users 
ADD COLUMN role ENUM('user', 'admin', 'moderator') DEFAULT 'user' AFTER provider_id;

-- Add is_active column (will error if column already exists - that's okay, just continue)
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER role;

-- Add indexes for better query performance (will error if index already exists - that's okay)
ALTER TABLE users 
ADD INDEX idx_role (role);

ALTER TABLE users 
ADD INDEX idx_active (is_active);

-- Update all existing users to have 'user' role (if not already set)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Set all existing users as active (if not already set)
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

