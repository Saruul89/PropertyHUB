'use client';

import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Billing, BillingItem } from '@/types';

export type BillingWithItems = Billing & {
  billing_items?: BillingItem[];
};

type TenantBillingsResponse = {
  data: BillingWithItems[];
  totalCount: number;
};

const ITEMS_PER_PAGE = 10;

async function fetchTenantBillings(
  tenantId: string,
  page: number
): Promise<TenantBillingsResponse> {
  const supabase = createClient();

  const { data, count } = await supabase
    .from('billings')
    .select(
      `
      *,
      billing_items(*)
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .neq('status', 'cancelled') // Hide cancelled billings from tenant portal
    .order('billing_month', { ascending: false })
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

  return {
    data: data || [],
    totalCount: count ?? 0,
  };
}

export function useTenantBillings(tenantId: string | null, page: number = 0) {
  return useQuery({
    queryKey: queryKeys.tenantPortal.billings(tenantId!, page),
    queryFn: () => fetchTenantBillings(tenantId!, page),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

// Helper to calculate billing stats
export function getTenantBillingStats(billings: BillingWithItems[]) {
  return {
    total: billings.length,
    unpaid: billings.filter((b) => b.status === 'pending' || b.status === 'overdue').length,
    paid: billings.filter((b) => b.status === 'paid').length,
    unpaidAmount: billings
      .filter((b) => b.status === 'pending' || b.status === 'overdue' || b.status === 'partial')
      .reduce((sum, b) => sum + (b.total_amount - b.paid_amount), 0),
  };
}

export { ITEMS_PER_PAGE };
