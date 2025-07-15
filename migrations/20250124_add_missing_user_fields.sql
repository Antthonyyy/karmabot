-- Add missing email and profile_picture fields to users table
-- This migration ensures users table supports Google authentication

-- Add email field for Google authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email text;

-- Add profile_picture field for Google profile pictures  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_picture text;

-- Add unique constraint on email
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add comment for documentation
COMMENT ON COLUMN users.email IS 'User email from Google authentication';
COMMENT ON COLUMN users.profile_picture IS 'User profile picture URL from Google'; 