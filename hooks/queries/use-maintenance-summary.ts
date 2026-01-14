'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

export type MaintenanceSummary = {
  pending: number;
  in_progress: number;
  completed: number;
  total: number;
};

async function fetchMaintenanceSummary(companyId: string): Promise<MaintenanceSummary> {
  const res = await fetch('/api/maintenance');
  if (!res.ok) {
    return { pending: 0, in_progress: 0, completed: 0, total: 0 };
  }
  const data = await res.json();
  const requests = data.data || [];

  const summary: MaintenanceSummary = {
    pending: 0,
    in_progress: 0,
    completed: 0,
    total: requests.length,
  };

  requests.forEach((req: { status: string }) => {
    if (req.status === 'pending') summary.pending++;
    else if (req.status === 'in_progress') summary.in_progress++;
    else if (req.status === 'completed') summary.completed++;
  });

  return summary;
}

export function useMaintenanceSummary(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard.maintenanceSummary(companyId!),
    queryFn: () => fetchMaintenanceSummary(companyId!),
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  });
}
