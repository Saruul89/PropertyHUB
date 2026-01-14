'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './use-auth';
import { useTenantDetail } from '@/hooks/queries';
import { queryKeys } from '@/hooks/queries/keys';
import type { Tenant, Lease, Unit, Property, Company } from '@/types';

interface LeaseWithDetails extends Lease {
  unit?: Unit & { property?: Property };
}

interface TenantContextType {
  tenant: Tenant | null;
  lease: LeaseWithDetails | null;
  company: Company | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useTenant(): TenantContextType {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const isEnabled = !!user && role === 'tenant';

  const { data, isLoading: loading, refetch: queryRefetch } = useTenantDetail(
    isEnabled ? user?.id ?? null : null
  );

  const refetch = useCallback(async () => {
    if (user?.id) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tenants.detail(user.id) });
      await queryRefetch();
    }
  }, [user?.id, queryClient, queryRefetch]);

  return {
    tenant: data?.tenant ?? null,
    lease: data?.lease ?? null,
    company: data?.company ?? null,
    loading: isEnabled ? loading : false,
    refetch,
  };
}
