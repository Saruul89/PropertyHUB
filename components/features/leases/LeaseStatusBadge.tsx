'use client';

import { cn } from '@/lib/utils';
import { LEASE_STATUS_LABELS, LEASE_STATUS_COLORS } from '@/lib/constants';
import type { LeaseStatus } from '@/types';

interface LeaseStatusBadgeProps {
    status: LeaseStatus;
    className?: string;
}

export function LeaseStatusBadge({ status, className }: LeaseStatusBadgeProps) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                LEASE_STATUS_COLORS[status],
                className
            )}
        >
            {LEASE_STATUS_LABELS[status]}
        </span>
    );
}
