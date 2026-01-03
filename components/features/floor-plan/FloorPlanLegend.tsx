'use client';

import { UNIT_STATUS_LABELS } from '@/lib/constants';

const LEGEND_ITEMS = [
    { status: 'vacant', color: 'bg-blue-100 border-blue-400' },
    { status: 'occupied', color: 'bg-green-100 border-green-400' },
    { status: 'maintenance', color: 'bg-yellow-100 border-yellow-400' },
    { status: 'reserved', color: 'bg-purple-100 border-purple-400' },
] as const;

export function FloorPlanLegend() {
    return (
        <div className="flex flex-wrap gap-4 text-sm">
            {LEGEND_ITEMS.map(({ status, color }) => (
                <div key={status} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 ${color}`} />
                    <span className="text-gray-600">
                        {UNIT_STATUS_LABELS[status]}
                    </span>
                </div>
            ))}
        </div>
    );
}
