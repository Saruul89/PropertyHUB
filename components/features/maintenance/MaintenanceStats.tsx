'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MaintenanceWithRelations } from './MaintenanceList';

export interface MaintenanceStatsProps {
    requests: MaintenanceWithRelations[];
    showTotalCost?: boolean;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP').format(amount);
};

export function MaintenanceStats({ requests, showTotalCost = false }: MaintenanceStatsProps) {
    const pendingCount = requests.filter((r) => r.status === 'pending').length;
    const inProgressCount = requests.filter((r) => r.status === 'in_progress').length;
    const completedCount = requests.filter((r) => r.status === 'completed').length;
    const totalCost = requests
        .filter((r) => r.status === 'completed')
        .reduce((sum, r) => sum + (r.actual_cost || 0), 0);

    return (
        <div className="grid gap-4 sm:grid-cols-4">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                    <div className="text-sm text-gray-500">未対応</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
                    <div className="text-sm text-gray-500">対応中</div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                    <div className="text-sm text-gray-500">完了</div>
                </CardContent>
            </Card>
            {showTotalCost && (
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-gray-600">
                            ¥{formatCurrency(totalCost)}
                        </div>
                        <div className="text-sm text-gray-500">総コスト</div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
