'use client';

import { UNIT_STATUS_LABELS } from '@/lib/constants';
import type { UnitStatus } from '@/types';

interface UnitStatusSelectProps {
    value: UnitStatus;
    onChange: (status: UnitStatus) => void;
    disabled?: boolean;
    className?: string;
}

const statuses: UnitStatus[] = ['vacant', 'occupied', 'maintenance', 'reserved'];

export function UnitStatusSelect({ value, onChange, disabled, className }: UnitStatusSelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as UnitStatus)}
            disabled={disabled}
            className={className || 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'}
        >
            {statuses.map((status) => (
                <option key={status} value={status}>
                    {UNIT_STATUS_LABELS[status]}
                </option>
            ))}
        </select>
    );
}
