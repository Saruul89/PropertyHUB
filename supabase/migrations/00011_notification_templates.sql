-- =====================================================
-- Notification Templates and Settings Extension
-- =====================================================

-- Add new columns to company_notification_settings table
ALTER TABLE company_notification_settings
ADD COLUMN IF NOT EXISTS payment_reminder_days_before INT NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS billing_issued_template TEXT,
ADD COLUMN IF NOT EXISTS payment_reminder_template TEXT;

-- Add comments for new columns
COMMENT ON COLUMN company_notification_settings.payment_reminder_days_before IS 'Days before due date to send payment reminder (default: 3)';
COMMENT ON COLUMN company_notification_settings.billing_issued_template IS 'Custom email template for billing issued notifications';
COMMENT ON COLUMN company_notification_settings.payment_reminder_template IS 'Custom email template for payment reminder notifications';
