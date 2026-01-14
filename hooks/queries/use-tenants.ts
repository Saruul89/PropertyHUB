'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Tenant, Lease, Unit, Property, TenantType } from '@/types';

export type TenantWithLease = Tenant & {
  lease?: (Lease & { unit?: Unit & { property?: Property } }) | null;
};

export type TenantFilters = {
  propertyId?: string;
  type?: TenantType | 'all';
  assignment?: 'all' | 'assigned' | 'unassigned';
};

type UnitWithProperty = Unit & { properties: Property };
type TenantWithLeases = Tenant & { leases?: Array<Lease & { units: UnitWithProperty }> };

async function fetchTenants(companyId: string): Promise<TenantWithLease[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      leases(*, units(*, properties(id, name)))
    `)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Transform data to match TenantWithLease interface
  return (data as TenantWithLeases[]).map((tenant) => {
    const leases = tenant.leases;
    const activeLease = leases?.find((l) => l.status === 'active');

    return {
      ...tenant,
      leases: undefined,
      lease: activeLease
        ? {
            ...activeLease,
            unit: {
              ...activeLease.units,
              property: activeLease.units.properties,
            },
          }
        : null,
    } as TenantWithLease;
  });
}

async function deleteTenant(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('tenants')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

export function useTenants(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.tenants.list(companyId!),
    queryFn: () => fetchTenants(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenants.all });
    },
  });
}

// Helper to filter tenants client-side
export function filterTenants(
  tenants: TenantWithLease[],
  search: string,
  filters: TenantFilters
): TenantWithLease[] {
  return tenants.filter((tenant) => {
    // Search filter
    const matchesSearch =
      search === '' ||
      tenant.name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.phone.includes(search);

    // Property filter
    const matchesProperty =
      !filters.propertyId ||
      filters.propertyId === 'all' ||
      tenant.lease?.unit?.property?.id === filters.propertyId;

    // Type filter
    const matchesType =
      !filters.type || filters.type === 'all' || tenant.tenant_type === filters.type;

    // Assignment filter
    const matchesAssignment =
      !filters.assignment ||
      filters.assignment === 'all' ||
      (filters.assignment === 'assigned' && tenant.lease?.unit) ||
      (filters.assignment === 'unassigned' && !tenant.lease?.unit);

    return matchesSearch && matchesProperty && matchesType && matchesAssignment;
  });
}
