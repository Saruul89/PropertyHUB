'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/types';
import { useAuth } from './use-auth';
import { queryKeys } from './queries/keys';

async function fetchCompany(companyId: string): Promise<Company | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  return data as Company | null;
}

export function useCompany() {
  const { companyId } = useAuth();

  const { data: company, isLoading: loading } = useQuery({
    queryKey: queryKeys.companies.detail(companyId!),
    queryFn: () => fetchCompany(companyId!),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { company: company ?? null, loading };
}

// Hook to invalidate company cache when needed
export function useInvalidateCompany() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
}

// Backwards-compatible function for non-hook contexts
export function invalidateCompanyCache() {
  // This is a no-op now since React Query handles cache
  // Kept for backwards compatibility
  console.warn('invalidateCompanyCache is deprecated. Use useInvalidateCompany hook instead.');
}
