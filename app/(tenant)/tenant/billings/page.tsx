'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/hooks';
import { Billing, BillingItem, BillingStatus } from '@/types';
import {
    Receipt,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';

interface BillingWithItems extends Billing {
    billing_items?: BillingItem[];
}

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Төлөгдөөгүй', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    partial: { label: 'Хэсэгчлэн төлсөн', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    paid: { label: 'Төлөгдсөн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    overdue: { label: 'Хугацаа хэтэрсэн', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Цуцлагдсан', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

export default function TenantBillingsPage() {
    const { tenant, loading: tenantLoading } = useTenant();
    const [billings, setBillings] = useState<BillingWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBilling, setSelectedBilling] = useState<BillingWithItems | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (tenant) {
            fetchBillings();
        }
    }, [tenant, currentPage]);

    const fetchBillings = async () => {
        setLoading(true);
        const supabase = createClient();

        const { data, count } = await supabase
            .from('billings')
            .select(`
                *,
                billing_items(*)
            `, { count: 'exact' })
            .eq('tenant_id', tenant?.id)
            .order('billing_month', { ascending: false })
            .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

        if (data) {
            setBillings(data);
            setTotalCount(count ?? 0);
        }
        setLoading(false);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const stats = {
        total: billings.length,
        unpaid: billings.filter((b) => b.status === 'pending' || b.status === 'overdue').length,
        paid: billings.filter((b) => b.status === 'paid').length,
        unpaidAmount: billings
            .filter((b) => b.status === 'pending' || b.status === 'overdue' || b.status === 'partial')
            .reduce((sum, b) => sum + (b.total_amount - b.paid_amount), 0),
    };

    if (tenantLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-gray-500">Ачааллаж байна...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">Нэхэмжлэхийн жагсаалт</h1>

            {/* Stats */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-sm text-gray-500">Нийт нэхэмжлэх</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{stats.unpaid}</div>
                        <p className="text-sm text-gray-500">Төлөгдөөгүй</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                        <p className="text-sm text-gray-500">Төлөгдсөн</p>
                    </CardContent>
                </Card>
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-800">
                            ₮{stats.unpaidAmount.toLocaleString()}
                        </div>
                        <p className="text-sm text-yellow-700">Төлөгдөөгүй нийт дүн</p>
                    </CardContent>
                </Card>
            </div>

            {/* Billings List */}
            {loading ? (
                <div className="text-center text-gray-500">Ачааллаж байна...</div>
            ) : billings.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Receipt className="mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-gray-600">Нэхэмжлэх байхгүй</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {billings.map((billing) => {
                        const statusInfo = statusConfig[billing.status];
                        const StatusIcon = statusInfo.icon;
                        const isOverdue =
                            billing.status === 'pending' && new Date(billing.due_date) < new Date();

                        return (
                            <Card
                                key={billing.id}
                                className={`cursor-pointer transition-shadow hover:shadow-md ${
                                    isOverdue ? 'border-red-200' : ''
                                }`}
                                onClick={() => setSelectedBilling(billing)}
                            >
                                <CardContent className="py-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`rounded-lg p-2 ${
                                                    isOverdue
                                                        ? 'bg-red-100'
                                                        : billing.status === 'paid'
                                                          ? 'bg-green-100'
                                                          : 'bg-yellow-100'
                                                }`}
                                            >
                                                <Receipt
                                                    className={`h-5 w-5 ${
                                                        isOverdue
                                                            ? 'text-red-600'
                                                            : billing.status === 'paid'
                                                              ? 'text-green-600'
                                                              : 'text-yellow-600'
                                                    }`}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {new Date(billing.billing_month).toLocaleDateString(
                                                        'ja-JP',
                                                        { year: 'numeric', month: 'long' }
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    支払期限:{' '}
                                                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                                        {new Date(billing.due_date).toLocaleDateString('ja-JP')}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold">
                                                    ₮{billing.total_amount.toLocaleString()}
                                                </p>
                                                {billing.paid_amount > 0 &&
                                                    billing.paid_amount < billing.total_amount && (
                                                        <p className="text-xs text-green-600">
                                                            Төлсөн: ₮{billing.paid_amount.toLocaleString()}
                                                        </p>
                                                    )}
                                            </div>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                                                    isOverdue
                                                        ? 'bg-red-100 text-red-800'
                                                        : statusInfo.color
                                                }`}
                                            >
                                                <StatusIcon className="h-4 w-4" />
                                                {isOverdue ? 'Хугацаа хэтэрсэн' : statusInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Нийт {totalCount}-с {currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} харуулж байна
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Өмнөх
                        </Button>
                        <span className="px-3 text-sm">
                            {currentPage + 1} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                        >
                            Дараах
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Billing Detail Modal */}
            {selectedBilling && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                {new Date(selectedBilling.billing_month).toLocaleDateString('mn-MN', {
                                    year: 'numeric',
                                    month: 'long',
                                })}
                                -ийн нэхэмжлэх
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedBilling(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Status */}
                            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                                <span className="text-gray-600">Төлөв</span>
                                <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm font-medium ${
                                        statusConfig[selectedBilling.status].color
                                    }`}
                                >
                                    {statusConfig[selectedBilling.status].label}
                                </span>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Огноо</p>
                                    <p className="font-medium">
                                        {new Date(selectedBilling.issue_date).toLocaleDateString('mn-MN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Төлөх хугацаа</p>
                                    <p className="font-medium">
                                        {new Date(selectedBilling.due_date).toLocaleDateString('mn-MN')}
                                    </p>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <p className="mb-2 font-medium">Задаргаа</p>
                                <div className="rounded-lg border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500">
                                                    Төлбөрийн нэр
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                    Тоо хэмжээ
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                    Нэгж үнэ
                                                </th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-500">
                                                    Дүн
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {selectedBilling.billing_items?.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-3 py-2">{item.fee_name}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        ₮{item.unit_price.toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        ₮{item.amount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Дүн</span>
                                    <span>₮{selectedBilling.subtotal.toLocaleString()}</span>
                                </div>
                                {selectedBilling.tax_amount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Татвар</span>
                                        <span>₮{selectedBilling.tax_amount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Нийт дүн</span>
                                    <span>₮{selectedBilling.total_amount.toLocaleString()}</span>
                                </div>
                                {selectedBilling.paid_amount > 0 && (
                                    <>
                                        <div className="flex justify-between text-green-600">
                                            <span>Төлсөн</span>
                                            <span>
                                                ₮{selectedBilling.paid_amount.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between font-bold text-yellow-600">
                                            <span>Үлдэгдэл</span>
                                            <span>
                                                ₮
                                                {(
                                                    selectedBilling.total_amount -
                                                    selectedBilling.paid_amount
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
