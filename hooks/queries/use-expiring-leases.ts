'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

export type ExpiringLease = {
  id: string;
  tenant_name: string;
  unit_number: string;
  property_name: string;
  end_date: string;
  days_remaining: number;
};

async function fetchExpiringLeases(companyId: string, days: number): Promise<ExpiringLease[]> {
  const res = await fetch(`/api/leases/expiring?days=${days}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export function useExpiringLeases(companyId: string | null, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.dashboard.expiringLeases(companyId!, days),
    queryFn: () => fetchExpiringLeases(companyId!, days),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
