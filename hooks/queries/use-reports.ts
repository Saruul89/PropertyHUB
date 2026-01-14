'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

export type BillingSummary = {
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  overdue_count: number;
  overdue_amount: number;
  pending_count: number;
  partial_count: number;
  paid_count: number;
  cancelled_count: number;
  collection_rate: number;
  month: string;
};

export type PropertyStats = {
  property_id: string;
  property_name: string;
  total_billed: number;
  total_paid: number;
  billing_count: number;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
};

export type FeeTypeStats = {
  fee_name: string;
  total_amount: number;
  count: number;
};

export type OverdueTenant = {
  tenant_name: string;
  unit_number: string;
  property_name: string;
  total_amount: number;
  paid_amount: number;
  outstanding: number;
  due_date: string;
};

export type MonthlyReport = {
  month: string;
  summary: {
    total_billed: number;
    total_paid: number;
    total_outstanding: number;
    collection_rate: number;
  };
  by_property: PropertyStats[];
  by_fee_type: FeeTypeStats[];
  overdue_tenants: OverdueTenant[];
};

async function fetchBillingSummary(month: string): Promise<BillingSummary | null> {
  const res = await fetch(`/api/reports/billing/summary?month=${month}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

async function fetchMonthlyReport(month: string): Promise<MonthlyReport | null> {
  const res = await fetch(`/api/reports/billing/monthly?month=${month}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export function useBillingSummary(companyId: string | null, month: string) {
  return useQuery({
    queryKey: queryKeys.reports.billingSummary(companyId!, { month }),
    queryFn: () => fetchBillingSummary(month),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyReport(companyId: string | null, month: string) {
  return useQuery({
    queryKey: queryKeys.reports.monthly(companyId!, parseInt(month.split('-')[0])),
    queryFn: () => fetchMonthlyReport(month),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

// Helper functions
export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
    '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
  ];
  return `${year} оны ${monthNames[parseInt(month) - 1]}`;
}

export function navigateMonth(currentMonth: string, direction: 'prev' | 'next'): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
