'use client';

import { useCompany } from './use-company';
import type { CompanyFeatures } from '@/types';

export function useFeature(featureName: keyof CompanyFeatures): boolean {
    const { company } = useCompany();
    return company?.features?.[featureName] ?? false;
}
