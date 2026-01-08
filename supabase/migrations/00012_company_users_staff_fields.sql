-- ============================================
-- Add staff management fields to company_users
-- ============================================

-- Add new columns for staff information
ALTER TABLE company_users
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS initial_password VARCHAR(50);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_users_email ON company_users(user_email);

-- Comment on columns
COMMENT ON COLUMN company_users.user_email IS 'Staff email address for login';
COMMENT ON COLUMN company_users.user_name IS 'Staff display name';
COMMENT ON COLUMN company_users.user_phone IS 'Staff phone number';
COMMENT ON COLUMN company_users.initial_password IS 'Initial password shown to admin (for staff to share)';
