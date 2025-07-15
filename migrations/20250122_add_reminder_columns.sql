-- Add missing columns to reminder_schedules table
-- This migration ensures reminder_schedules table matches schema.ts

-- Add principle_number column for tracking which principle reminder is for
ALTER TABLE reminder_schedules 
ADD COLUMN IF NOT EXISTS principle_number integer;

-- Add custom_message column for personalized reminder messages
ALTER TABLE reminder_schedules 
ADD COLUMN IF NOT EXISTS custom_message text;

-- Add comment for documentation
COMMENT ON COLUMN reminder_schedules.principle_number IS 'Which principle number this reminder is for';
COMMENT ON COLUMN reminder_schedules.custom_message IS 'Custom message for this reminder'; 