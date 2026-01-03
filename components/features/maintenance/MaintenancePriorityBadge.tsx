'use client';

import { cn } from '@/lib/utils';
import { MAINTENANCE_PRIORITY_LABELS, MAINTENANCE_PRIORITY_COLORS } from '@/lib/constants';
import type { MaintenancePriority } from '@/types';

interface MaintenancePriorityBadgeProps {
    priority: MaintenancePriority;
    className?: string;
}

export function MaintenancePriorityBadge({ priority, className }: MaintenancePriorityBadgeProps) {
    return (
        <span
            className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                MAINTENANCE_PRIORITY_COLORS[priority],
                className
            )}
        >
            {MAINTENANCE_PRIORITY_LABELS[priority]}
        </span>
    );
}
