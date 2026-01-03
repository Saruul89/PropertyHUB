'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { Billing, BillingStatus, Tenant, Unit } from '@/types';
import {
    Plus,
    Receipt,
    Search,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    XCircle,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface BillingWithDetails extends Billing {
    tenant?: Tenant;
    unit?: Unit & { property?: { name: string } };
}

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: 'Төлөгдөөгүй', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    partial: { label: 'Хэсэгчлэн төлсөн', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    paid: { label: 'Төлөгдсөн', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    overdue: { label: 'Хугацаа хэтэрсэн', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'Цуцлагдсан', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const ITEMS_PER_PAGE = 20;

export default function BillingsPage() {
    const { companyId } = useAuth();
    const [billings, setBillings] = useState<BillingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<BillingStatus | 'all'>('all');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (companyId) {
            fetchBillings();
        }
    }, [companyId, currentPage, statusFilter]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(0);
    }, [statusFilter, search]);

    const fetchBillings = async () => {
        setLoading(true);
        const supabase = createClient();

        // Build query with filters
        let query = supabase
            .from('billings')
            .select(`
                *,
                tenants(*),
                units(*, properties(name))
            `, { count: 'exact' })
            .eq('company_id', companyId);

        // Apply status filter at database level
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        // Apply pagination and ordering
        const { data, error, count } = await query
            .order('billing_month', { ascending: false })
            .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

        if (!error && data) {
            setBillings(
                data.map((b: Record<string, unknown>) => ({
                    ...b,
                    tenant: b.tenants as Tenant | undefined,
                    unit: b.units ? { ...(b.units as Unit), property: (b.units as Record<string, unknown>).properties as { name: string } | undefined } : undefined,
                })) as BillingWithDetails[]
            );
            setTotalCount(count ?? 0);
        }
        setLoading(false);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    // Search is done client-side on the current page (status filter is done in DB)
    const filteredBillings = billings.filter((billing) => {
        if (!search) return true;
        const matchesSearch =
            billing.tenant?.name.toLowerCase().includes(search.toLowerCase()) ||
            billing.unit?.unit_number.toLowerCase().includes(search.toLowerCase()) ||
            billing.billing_number?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const stats = {
        total: billings.length,
        pending: billings.filter((b) => b.status === 'pending').length,
        overdue: billings.filter((b) => b.status === 'overdue').length,
        totalAmount: billings
            .filter((b) => b.status !== 'cancelled')
            .reduce((sum, b) => sum + b.total_amount, 0),
        paidAmount: billings.reduce((sum, b) => sum + b.paid_amount, 0),
    };

    return (
        <>
            <Header title="Төлбөр нэхэмжлэх" />
            <div className="p-6">
                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">₮{stats.totalAmount.toLocaleString()}</div>
                            <p className="text-sm text-gray-500">Нийт нэхэмжилсэн</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">
                                ₮{stats.paidAmount.toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-500">Төлөгдсөн</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <p className="text-sm text-gray-500">Төлөгдөөгүй</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                            <p className="text-sm text-gray-500">Хугацаа хэтэрсэн</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Оршин суугч, өрөөгөөр хайх..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as BillingStatus | 'all')}
                            >
                                <option value="all">Бүх төлөв</option>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <option key={key} value={key}>
                                        {config.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Link href="/dashboard/billings/generate">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Нэхэмжлэх үүсгэх
                        </Button>
                    </Link>
                </div>

                {/* Billings Table */}
                {loading ? (
                    <div className="text-center text-gray-500">Ачааллаж байна...</div>
                ) : filteredBillings.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Receipt className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-600">
                                {search || statusFilter !== 'all'
                                    ? 'Хайлтад тохирох нэхэмжлэх олдсонгүй'
                                    : 'Нэхэмжлэх байхгүй'}
                            </p>
                            {!search && statusFilter === 'all' && (
                                <Link href="/dashboard/billings/generate">
                                    <Button>Эхний нэхэмжлэх үүсгэх</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Нэхэмжлэхийн дугаар
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Оршин суугч
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Барилга・Өрөө
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Тооцооны сар
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Төлөх хугацаа
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                        Дүн
                                    </th>
                                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">
                                        Төлөв
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                        Үйлдэл
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredBillings.map((billing) => {
                                    const statusInfo = statusConfig[billing.status];
                                    const StatusIcon = statusInfo.icon;
                                    const isOverdue =
                                        billing.status === 'pending' &&
                                        new Date(billing.due_date) < new Date();

                                    return (
                                        <tr key={billing.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm">
                                                    {billing.billing_number || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium">
                                                    {billing.tenant?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p>{billing.unit?.property?.name}</p>
                                                    <p className="text-gray-500">
                                                        {billing.unit?.unit_number}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(billing.billing_month).toLocaleDateString('mn-MN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={isOverdue ? 'font-medium text-red-600' : ''}
                                                >
                                                    {new Date(billing.due_date).toLocaleDateString('mn-MN')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div>
                                                    <p className="font-medium">
                                                        ₮{billing.total_amount.toLocaleString()}
                                                    </p>
                                                    {billing.paid_amount > 0 && (
                                                        <p className="text-sm text-green-600">
                                                            Төлсөн: ₮{billing.paid_amount.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
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
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={`/dashboard/billings/${billing.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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
            </div>
        </>
    );
}
