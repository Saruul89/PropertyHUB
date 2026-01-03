import type { LeaseStatus } from '@/types';

export const LEASE_STATUS = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    TERMINATED: 'terminated',
    PENDING: 'pending',
} as const;

export const LEASE_STATUS_LABELS: Record<LeaseStatus, string> = {
    active: 'Идэвхтэй',
    expired: 'Хугацаа дууссан',
    terminated: 'Цуцлагдсан',
    pending: 'Хүлээгдэж буй',
};

export const LEASE_STATUS_COLORS: Record<LeaseStatus, string> = {
    active: 'bg-green-100 text-green-800',
    expired: 'bg-gray-100 text-gray-800',
    terminated: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
};
