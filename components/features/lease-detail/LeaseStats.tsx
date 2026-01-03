'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LeaseWithRelations } from './LeaseList';

export interface LeaseStatsProps {
    leases: LeaseWithRelations[];
}

const getDaysUntilExpiry = (endDate: string | undefined) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

export function LeaseStats({ leases }: LeaseStatsProps) {
    const activeCount = leases.filter((l) => l.status === 'active').length;
    const pendingCount = leases.filter((l) => l.status === 'pending').length;
    const expiringCount = leases.filter((l) => {
        const days = getDaysUntilExpiry(l.end_date);
        return days !== null && days <= 30 && days > 0 && l.status === 'active';
    }).length;
    const endedCount = leases.filter(
        (l) => l.status === 'expired' || l.status === 'terminated'
    ).length;

    return (
        <div className="grid gap-4 sm:grid-cols-4">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    <div className="text-sm text-gray-500">契約中</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    <div className="text-sm text-gray-500">審査中</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-600">{expiringCount}</div>
                    <div className="text-sm text-gray-500">30日以内に満了</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-gray-600">{endedCount}</div>
                    <div className="text-sm text-gray-500">終了済み</div>
                </CardContent>
            </Card>
        </div>
    );
}
