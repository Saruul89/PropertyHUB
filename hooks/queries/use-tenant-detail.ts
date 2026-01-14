'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Tenant, Lease, Unit, Property, Company } from '@/types';

export type LeaseWithDetails = Lease & {
  unit?: Unit & { property?: Property };
};

export type TenantDetailData = {
  tenant: Tenant | null;
  lease: LeaseWithDetails | null;
  company: Company | null;
};

async function fetchTenantDetail(userId: string): Promise<TenantDetailData> {
  const supabase = createClient();

  // Get tenant data
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (tenantError || !tenantData) {
    return { tenant: null, lease: null, company: null };
  }

  // Get active lease with unit and property info
  const { data: leaseData } = await supabase
    .from('leases')
    .select(`
      *,
      units(*, properties(*))
    `)
    .eq('tenant_id', tenantData.id)
    .eq('status', 'active')
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  let lease: LeaseWithDetails | null = null;
  if (leaseData) {
    lease = {
      ...leaseData,
      unit: leaseData.units
        ? {
            ...(leaseData.units as Unit),
            property: (leaseData.units as Record<string, unknown>).properties as Property,
          }
        : undefined,
    };
  }

  // Get company data
  const { data: companyData } = await supabase
    .from('companies')
    .select('*')
    .eq('id', tenantData.company_id)
    .single();

  return {
    tenant: tenantData,
    lease,
    company: companyData || null,
  };
}

export function useTenantDetail(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.tenants.detail(userId!),
    queryFn: () => fetchTenantDetail(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
