'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Billing, BillingStatus, Tenant, Unit } from '@/types';

export type BillingWithDetails = Billing & {
  tenant?: Tenant;
  unit?: Unit & { property?: { name: string } };
};

export type BillingFilters = {
  status?: BillingStatus | 'all';
  page: number;
  pageSize?: number;
};

export type BillingListResult = {
  data: BillingWithDetails[];
  totalCount: number;
};

const DEFAULT_PAGE_SIZE = 20;

async function fetchBillings(
  companyId: string,
  filters: BillingFilters
): Promise<BillingListResult> {
  const supabase = createClient();
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  // Build query with filters
  let query = supabase
    .from('billings')
    .select(
      `
      *,
      tenants(*),
      units(*, properties(name))
    `,
      { count: 'exact' }
    )
    .eq('company_id', companyId);

  // Apply status filter at database level
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  // Apply pagination and ordering (sort by billing_number descending for newest first)
  const { data, error, count } = await query
    .order('billing_number', { ascending: false })
    .range(filters.page * pageSize, (filters.page + 1) * pageSize - 1);

  if (error || !data) return { data: [], totalCount: 0 };

  // Transform data
  const billings = data.map((b: Record<string, unknown>) => ({
    ...b,
    tenant: b.tenants as Tenant | undefined,
    unit: b.units
      ? {
          ...(b.units as Unit),
          property: (b.units as Record<string, unknown>).properties as { name: string } | undefined,
        }
      : undefined,
  })) as BillingWithDetails[];

  return { data: billings, totalCount: count ?? 0 };
}

async function deleteBilling(id: string): Promise<void> {
  const supabase = createClient();

  // First delete billing items
  await supabase.from('billing_items').delete().eq('billing_id', id);

  // Then delete the billing
  const { error } = await supabase.from('billings').delete().eq('id', id);
  if (error) throw error;
}

async function cancelBilling(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('billings')
    .update({ status: 'cancelled' })
    .eq('id', id);
  if (error) throw error;
}

export function useBillings(companyId: string | null, filters: BillingFilters) {
  return useQuery({
    queryKey: queryKeys.billings.list(companyId!, filters),
    queryFn: () => fetchBillings(companyId!, filters),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData, // Smooth pagination transitions
  });
}

export function useDeleteBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billings.all });
    },
  });
}

export function useCancelBilling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBilling,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.billings.all });
    },
  });
}

// Helper to filter billings client-side (for search within current page)
export function filterBillings(billings: BillingWithDetails[], search: string): BillingWithDetails[] {
  if (!search) return billings;
  const searchLower = search.toLowerCase();
  return billings.filter(
    (billing) =>
      billing.tenant?.name.toLowerCase().includes(searchLower) ||
      billing.unit?.unit_number.toLowerCase().includes(searchLower) ||
      billing.billing_number?.toLowerCase().includes(searchLower)
  );
}

// Calculate billing statistics from current page data
export function getBillingStats(billings: BillingWithDetails[]) {
  return {
    total: billings.length,
    pending: billings.filter((b) => b.status === 'pending').length,
    overdue: billings.filter((b) => b.status === 'overdue').length,
    totalAmount: billings
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.total_amount, 0),
    paidAmount: billings.reduce((sum, b) => sum + b.paid_amount, 0),
  };
}
