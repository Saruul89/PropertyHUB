'use client';

import { cn } from '@/lib/utils';
import { TENANT_TYPE_LABELS, TENANT_TYPE_COLORS } from '@/lib/constants';
import type { TenantType } from '@/types';

interface TenantTypeBadgeProps {
    type: TenantType;
    className?: string;
}

export function TenantTypeBadge({ type, className }: TenantTypeBadgeProps) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-1 text-xs font-medium',
                TENANT_TYPE_COLORS[type],
                className
            )}
        >
            {TENANT_TYPE_LABELS[type]}
        </span>
    );
}
