'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout';
import { BarChart3, FileText, Download, Calendar } from 'lucide-react';

export default function ReportsPage() {
    const reports = [
        {
            id: 'monthly-revenue',
            title: '月次収益レポート',
            description: '月ごとの収益と請求状況',
            icon: BarChart3,
        },
        {
            id: 'occupancy',
            title: '入居率レポート',
            description: '物件ごとの入居率推移',
            icon: Calendar,
        },
        {
            id: 'billing-summary',
            title: '請求サマリー',
            description: '請求・支払い状況の概要',
            icon: FileText,
        },
        {
            id: 'overdue',
            title: '延滞レポート',
            description: '未払い・延滞請求の一覧',
            icon: FileText,
        },
    ];

    return (
        <div className="space-y-6">
            <Header title="レポート" />

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                    この機能は現在開発中です。詳細レポート機能は今後のアップデートで追加されます。
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {reports.map((report) => (
                    <Card key={report.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <report.icon className="h-5 w-5 text-blue-600" />
                                {report.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                            <Button variant="outline" disabled>
                                <Download className="h-4 w-4 mr-2" />
                                ダウンロード（準備中）
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
