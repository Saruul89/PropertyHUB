'use client';

import { cn } from '@/lib/utils';
import { MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS } from '@/lib/constants';
import type { MaintenanceStatus } from '@/types';

interface MaintenanceStatusBadgeProps {
    status: MaintenanceStatus;
    className?: string;
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
    return (
        <span
            className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                MAINTENANCE_STATUS_COLORS[status],
                className
            )}
        >
            {MAINTENANCE_STATUS_LABELS[status]}
        </span>
    );
}
