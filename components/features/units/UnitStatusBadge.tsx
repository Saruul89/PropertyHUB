'use client';

import { cn } from '@/lib/utils';
import { UNIT_STATUS_LABELS, UNIT_STATUS_COLORS } from '@/lib/constants';
import type { UnitStatus } from '@/types';

interface UnitStatusBadgeProps {
    status: UnitStatus;
    className?: string;
}

export function UnitStatusBadge({ status, className }: UnitStatusBadgeProps) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                UNIT_STATUS_COLORS[status],
                className
            )}
        >
            {UNIT_STATUS_LABELS[status]}
        </span>
    );
}
