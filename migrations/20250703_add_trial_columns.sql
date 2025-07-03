-- Add trial columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Set default values for plan and status
ALTER TABLE subscriptions 
ALTER COLUMN plan SET DEFAULT 'trial',
ALTER COLUMN status SET DEFAULT 'active';

-- Make billing columns nullable for trials
ALTER TABLE subscriptions 
ALTER COLUMN billing_period DROP NOT NULL,
ALTER COLUMN amount DROP NOT NULL,
ALTER COLUMN start_date DROP NOT NULL,
ALTER COLUMN end_date DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS sub_user_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS sub_exp_idx ON subscriptions(expires_at);

-- Add unique constraint for active subscriptions per user
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_subscription 
ON subscriptions(user_id) 
WHERE status = 'active';