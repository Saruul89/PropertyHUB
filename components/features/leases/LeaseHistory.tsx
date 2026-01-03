'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaseCard } from './LeaseCard';
import type { Lease, Unit, Property } from '@/types';

interface LeaseWithUnit extends Lease {
    unit?: Unit & { property?: Property };
}

interface LeaseHistoryProps {
    leases: LeaseWithUnit[];
}

export function LeaseHistory({ leases }: LeaseHistoryProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>契約履歴</CardTitle>
            </CardHeader>
            <CardContent>
                {leases.length === 0 ? (
                    <p className="text-gray-500">契約履歴がありません</p>
                ) : (
                    <div className="space-y-4">
                        {leases.map((lease) => (
                            <LeaseCard key={lease.id} lease={lease} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
