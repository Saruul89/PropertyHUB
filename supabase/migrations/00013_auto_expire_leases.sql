-- Migration: Auto-expire leases when end_date passes

-- Function to expire leases that have passed their end_date
CREATE OR REPLACE FUNCTION expire_ended_leases()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE leases
    SET
        status = 'expired',
        updated_at = NOW()
    WHERE
        status = 'active'
        AND end_date IS NOT NULL
        AND end_date < CURRENT_DATE;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN updated_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION expire_ended_leases() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ended_leases() TO service_role;

-- To enable daily cron job (requires pg_cron extension):
-- 1. Go to Supabase Dashboard > Database > Extensions > Enable pg_cron
-- 2. Run in SQL Editor:
--    SELECT cron.schedule('expire-ended-leases', '0 0 * * *', $$SELECT expire_ended_leases()$$);
