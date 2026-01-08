-- Dashboard Stats RPC Function
-- Combines 3 separate queries into 1 for better performance

CREATE OR REPLACE FUNCTION get_dashboard_stats(p_company_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'property_count', (
      SELECT COUNT(*)::int
      FROM properties
      WHERE company_id = p_company_id AND is_active = true
    ),
    'unit_count', (
      SELECT COUNT(*)::int
      FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.company_id = p_company_id
    ),
    'vacant_count', (
      SELECT COUNT(*)::int
      FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.company_id = p_company_id AND u.status = 'vacant'
    ),
    'tenant_count', (
      SELECT COUNT(*)::int
      FROM tenants
      WHERE company_id = p_company_id AND is_active = true
    )
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_dashboard_stats(UUID) IS
  'Returns dashboard statistics (property count, unit count, vacant count, tenant count) for a company';
