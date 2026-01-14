'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Lease, Tenant, Unit, Property, LeaseStatus } from '@/types';

export type LeaseWithRelations = Lease & {
  tenant: Tenant;
  unit: Unit & { property: Property };
};

export type LeaseFilters = {
  propertyId?: string;
  status?: LeaseStatus | 'all' | 'expiring_soon';
};

async function fetchLeases(companyId: string): Promise<LeaseWithRelations[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('leases')
    .select(`
      *,
      tenant:tenants(*),
      unit:units(*, property:properties(*))
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as LeaseWithRelations[];
}

async function deleteLease(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('leases').delete().eq('id', id);
  if (error) throw error;
}

export function useLeases(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.leases.list(companyId!),
    queryFn: () => fetchLeases(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDeleteLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leases.all });
    },
  });
}

// Helper function to calculate days until expiry
export function getDaysUntilExpiry(endDate: string | undefined): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper to filter leases client-side
export function filterLeases(
  leases: LeaseWithRelations[],
  search: string,
  filters: LeaseFilters
): LeaseWithRelations[] {
  return leases.filter((lease) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === '' ||
      lease.tenant.name.toLowerCase().includes(searchLower) ||
      lease.unit.unit_number.toLowerCase().includes(searchLower) ||
      lease.unit.property.name.toLowerCase().includes(searchLower);

    // Property filter
    const matchesProperty =
      !filters.propertyId ||
      filters.propertyId === 'all' ||
      lease.unit.property.id === filters.propertyId;

    // Status filter
    let matchesStatus = true;
    if (filters.status === 'expiring_soon') {
      const days = getDaysUntilExpiry(lease.end_date);
      matchesStatus = days !== null && days <= 30 && days > 0 && lease.status === 'active';
    } else if (filters.status && filters.status !== 'all') {
      matchesStatus = lease.status === filters.status;
    }

    return matchesSearch && matchesProperty && matchesStatus;
  });
}

// Get lease statistics
export function getLeaseStats(leases: LeaseWithRelations[]) {
  return {
    active: leases.filter((l) => l.status === 'active').length,
    pending: leases.filter((l) => l.status === 'pending').length,
    expiringSoon: leases.filter((l) => {
      const days = getDaysUntilExpiry(l.end_date);
      return days !== null && days <= 30 && days > 0 && l.status === 'active';
    }).length,
    expired: leases.filter((l) => l.status === 'expired' || l.status === 'terminated').length,
  };
}
