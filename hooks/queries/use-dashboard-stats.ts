'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';

export type DashboardStats = {
  propertyCount: number;
  unitCount: number;
  vacantCount: number;
  tenantCount: number;
};

async function fetchDashboardStats(companyId: string): Promise<DashboardStats> {
  const supabase = createClient();

  // Try RPC first for optimized single query
  const { data, error } = await supabase.rpc('get_dashboard_stats', {
    p_company_id: companyId,
  });

  if (!error && data) {
    return {
      propertyCount: data.property_count ?? 0,
      unitCount: data.unit_count ?? 0,
      vacantCount: data.vacant_count ?? 0,
      tenantCount: data.tenant_count ?? 0,
    };
  }

  // Fallback to individual queries if RPC not available
  const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true),
    supabase
      .from('units')
      .select('id, status, properties!inner(company_id)')
      .eq('properties.company_id', companyId),
    supabase
      .from('tenants')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .eq('is_active', true),
  ]);

  const units = unitsRes.data || [];

  return {
    propertyCount: propertiesRes.count || 0,
    unitCount: units.length,
    vacantCount: units.filter((u: { status: string }) => u.status === 'vacant').length,
    tenantCount: tenantsRes.count || 0,
  };
}

export function useDashboardStats(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(companyId!),
    queryFn: () => fetchDashboardStats(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
