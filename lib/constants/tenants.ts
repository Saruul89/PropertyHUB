import type { TenantType } from '@/types';

export const TENANT_TYPE = {
    INDIVIDUAL: 'individual',
    COMPANY: 'company',
} as const;

export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
    individual: 'Хувь хүн',
    company: 'Компани',
};

export const TENANT_TYPE_COLORS: Record<TenantType, string> = {
    individual: 'bg-blue-100 text-blue-800',
    company: 'bg-purple-100 text-purple-800',
};
