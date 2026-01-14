'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { FeeType, TenantMeterSubmission, MeterReading } from '@/types';

export type MeterTypeWithReading = FeeType & {
  lastReading?: number;
  pendingSubmission?: TenantMeterSubmission;
};

type MeterTypesResponse = {
  meterTypes: MeterTypeWithReading[];
  recentSubmissions: Array<TenantMeterSubmission & { fee_types?: { name: string } }>;
};

async function fetchMeterData(
  companyId: string,
  tenantId: string,
  unitId: string
): Promise<MeterTypesResponse> {
  const supabase = createClient();

  // Get metered fee types for the company
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .eq('calculation_type', 'metered')
    .order('display_order');

  if (!feeTypes || feeTypes.length === 0) {
    // Fetch recent submissions even if no fee types
    const { data: submissions } = await supabase
      .from('tenant_meter_submissions')
      .select('*, fee_types(name)')
      .eq('tenant_id', tenantId)
      .order('submitted_at', { ascending: false })
      .limit(10);

    return {
      meterTypes: [],
      recentSubmissions: submissions || [],
    };
  }

  const feeTypeIds = (feeTypes as FeeType[]).map((f) => f.id);

  // Batch fetch: Get all last readings for this unit in one query
  const { data: allReadings } = await supabase
    .from('meter_readings')
    .select('fee_type_id, current_reading, reading_date')
    .eq('unit_id', unitId)
    .in('fee_type_id', feeTypeIds)
    .order('reading_date', { ascending: false });

  // Batch fetch: Get all pending submissions for this tenant in one query
  const { data: allPendingSubmissions } = await supabase
    .from('tenant_meter_submissions')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('fee_type_id', feeTypeIds)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  // Fetch recent submissions
  const { data: recentSubmissions } = await supabase
    .from('tenant_meter_submissions')
    .select('*, fee_types(name)')
    .eq('tenant_id', tenantId)
    .order('submitted_at', { ascending: false })
    .limit(10);

  // Create maps for efficient lookup (take first occurrence since ordered by date desc)
  const lastReadingMap = new Map<string, number>();
  (allReadings as MeterReading[] | null)?.forEach((reading) => {
    if (!lastReadingMap.has(reading.fee_type_id)) {
      lastReadingMap.set(reading.fee_type_id, reading.current_reading);
    }
  });

  const pendingSubmissionMap = new Map<string, TenantMeterSubmission>();
  (allPendingSubmissions as TenantMeterSubmission[] | null)?.forEach((submission) => {
    if (!pendingSubmissionMap.has(submission.fee_type_id)) {
      pendingSubmissionMap.set(submission.fee_type_id, submission);
    }
  });

  // Combine data
  const meterTypes: MeterTypeWithReading[] = (feeTypes as FeeType[]).map((feeType) => ({
    ...feeType,
    lastReading: lastReadingMap.get(feeType.id) ?? 0,
    pendingSubmission: pendingSubmissionMap.get(feeType.id),
  }));

  return {
    meterTypes,
    recentSubmissions: recentSubmissions || [],
  };
}

type SubmitMeterParams = {
  tenantId: string;
  unitId: string;
  feeTypeId: string;
  reading: number;
  notes?: string;
};

async function submitMeterReading(params: SubmitMeterParams): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from('tenant_meter_submissions').insert({
    tenant_id: params.tenantId,
    unit_id: params.unitId,
    fee_type_id: params.feeTypeId,
    submitted_reading: params.reading,
    notes: params.notes || null,
  });

  if (error) throw error;
}

export function useMeterData(
  companyId: string | null,
  tenantId: string | null,
  unitId: string | null
) {
  return useQuery({
    queryKey: queryKeys.tenantPortal.meterTypes(companyId!),
    queryFn: () => fetchMeterData(companyId!, tenantId!, unitId!),
    enabled: !!companyId && !!tenantId && !!unitId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useSubmitMeterReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitMeterReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-portal'] });
    },
  });
}
