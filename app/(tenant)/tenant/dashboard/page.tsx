'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/hooks';
import { Billing, BillingStatus } from '@/types';
import {
    Home,
    Receipt,
    Gauge,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    CreditCard,
} from 'lucide-react';

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Төлөгдөөгүй', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    partial: { label: 'Хэсэгчлэн төлсөн', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    paid: { label: 'Төлөгдсөн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    overdue: { label: 'Хугацаа хэтэрсэн', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Цуцлагдсан', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
};

export default function TenantDashboardPage() {
    const { tenant, lease, company, loading: tenantLoading } = useTenant();
    const [recentBillings, setRecentBillings] = useState<Billing[]>([]);
    const [loading, setLoading] = useState(true);
    const [unpaidTotal, setUnpaidTotal] = useState(0);

    useEffect(() => {
        if (tenant) {
            fetchRecentBillings();
        }
    }, [tenant]);

    const fetchRecentBillings = async () => {
        const supabase = createClient();

        const { data } = await supabase
            .from('billings')
            .select('*')
            .eq('tenant_id', tenant?.id)
            .order('billing_month', { ascending: false })
            .limit(5);

        if (data) {
            setRecentBillings(data as Billing[]);
            const unpaid = (data as Billing[])
                .filter((b: Billing) => b.status === 'pending' || b.status === 'overdue' || b.status === 'partial')
                .reduce((sum: number, b: Billing) => sum + (b.total_amount - b.paid_amount), 0);
            setUnpaidTotal(unpaid);
        }
        setLoading(false);
    };

    if (tenantLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-gray-500">Ачааллаж байна...</div>
            </div>
        );
    }

    const unit = lease?.unit;
    const property = unit?.property;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Тавтай морил, {tenant?.name}</h1>
                <p className="text-gray-600">Оршин суугчийн портал руу тавтай морил</p>
            </div>

            {/* Unit Info Card */}
            <Card className="mb-6 border-green-200 bg-green-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <Home className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-green-700">Таны өрөө</p>
                            <p className="text-xl font-bold text-green-900">
                                {property?.name} - {unit?.unit_number} өрөө
                            </p>
                            {lease && (
                                <p className="text-sm text-green-600">
                                    Гэрээ эхэлсэн: {new Date(lease.start_date).toLocaleDateString('mn-MN')}
                                    {lease.end_date &&
                                        ` ～ ${new Date(lease.end_date).toLocaleDateString('mn-MN')}`}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-100 p-2">
                                <CreditCard className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    ₮{unpaidTotal.toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500">Төлөгдөөгүй дүн</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Receipt className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold">
                                    ₮{(lease?.monthly_rent ?? 0).toLocaleString()}
                                </div>
                                <p className="text-sm text-gray-500">Сарын түрээс</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Link href="/tenant/meter-submit">
                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-cyan-100 p-2">
                                    <Gauge className="h-5 w-5 text-cyan-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-lg font-medium">Тоолуур бүртгэх</div>
                                    <p className="text-sm text-gray-500">Энэ сарын заалт илгээх</p>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Recent Billings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Сүүлийн нэхэмжлэх</CardTitle>
                    <Link href="/tenant/billings">
                        <Button variant="ghost" size="sm">
                            Бүгдийг харах
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Ачааллаж байна...</div>
                    ) : recentBillings.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">Нэхэмжлэх байхгүй</div>
                    ) : (
                        <div className="space-y-3">
                            {recentBillings.map((billing) => {
                                const statusInfo = statusConfig[billing.status];
                                const StatusIcon = statusInfo.icon;
                                const isOverdue =
                                    billing.status === 'pending' &&
                                    new Date(billing.due_date) < new Date();

                                return (
                                    <div
                                        key={billing.id}
                                        className="flex items-center justify-between rounded-lg border p-4"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {new Date(billing.billing_month).toLocaleDateString(
                                                    'mn-MN',
                                                    { year: 'numeric', month: 'long' }
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Төлөх хугацаа:{' '}
                                                {new Date(billing.due_date).toLocaleDateString(
                                                    'mn-MN'
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="font-bold">
                                                    ₮{billing.total_amount.toLocaleString()}
                                                </p>
                                                {billing.paid_amount > 0 && (
                                                    <p className="text-xs text-green-600">
                                                        Төлсөн: ₮{billing.paid_amount.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                                    isOverdue
                                                        ? 'bg-red-100 text-red-800'
                                                        : statusInfo.color
                                                }`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {isOverdue ? 'Хугацаа хэтэрсэн' : statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
