'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks';
import { useBillings, useDeleteBilling, useCancelBilling, filterBillings, getBillingStats } from '@/hooks/queries';
import type { BillingStatus } from '@/types';
import { BillingsSkeleton } from '@/components/skeletons';
import {
  Plus,
  Receipt,
  Search,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Banknote,
  TrendingUp,
  AlertTriangle,
  Ban,
} from 'lucide-react';

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Төлөгдөөгүй', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  partial: { label: 'Хэсэгчлэн', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
  paid: { label: 'Төлөгдсөн', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Хэтэрсэн', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  cancelled: { label: 'Цуцлагдсан', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: XCircle },
};

const ITEMS_PER_PAGE = 20;

export default function BillingsPage() {
  const { companyId } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillingStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(0);

  const { data, isLoading: loading } = useBillings(companyId, {
    page: currentPage,
    status: statusFilter,
    pageSize: ITEMS_PER_PAGE,
  });

  const deleteBilling = useDeleteBilling();
  const cancelBilling = useCancelBilling();

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter]);

  const billings = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleDelete = async (billingId: string, billingNumber: string | null) => {
    if (!confirm(`"${billingNumber || billingId}" нэхэмжлэхийг устгах уу?`)) return;
    deleteBilling.mutate(billingId);
  };

  const handleCancel = async (billingId: string, billingNumber: string | null) => {
    if (!confirm(`"${billingNumber || billingId}" нэхэмжлэхийг цуцлах уу?`)) return;
    cancelBilling.mutate(billingId);
  };

  // Search is done client-side on the current page
  const filteredBillings = useMemo(() => filterBillings(billings, search), [billings, search]);
  const stats = useMemo(() => getBillingStats(billings), [billings]);

  return (
    <>
      <Header title="Төлбөр нэхэмжлэх" />
      <div className="space-y-6 p-4 md:p-6">
        {/* Stats Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-600 text-white">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Нийт нэхэмжилсэн</p>
                  <p className="text-lg font-bold text-slate-900">₮{stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-600">Төлөгдсөн</p>
                  <p className="text-lg font-bold text-emerald-700">₮{stats.paidAmount.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                  <Banknote className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-600">Төлөгдөөгүй</p>
                  <p className="text-lg font-bold text-amber-700">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600">Хугацаа хэтэрсэн</p>
                  <p className="text-lg font-bold text-red-700">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Оршин суугч, өрөөгөөр хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 border-slate-200 bg-white pl-10"
              />
            </div>
            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
          <Link href="/dashboard/billings/generate">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Нэхэмжлэх үүсгэх
            </Button>
          </Link>
        </div>

        {/* Billings Content */}
        {loading ? (
          <BillingsSkeleton />
        ) : filteredBillings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Receipt className="h-8 w-8 text-slate-400" />
              </div>
              <p className="mb-2 text-lg font-medium text-slate-700">
                {search || statusFilter !== 'all' ? 'Илэрц олдсонгүй' : 'Нэхэмжлэх байхгүй'}
              </p>
              <p className="mb-6 text-sm text-slate-500">
                {search || statusFilter !== 'all'
                  ? 'Хайлтын утгаа өөрчилнө үү'
                  : 'Эхний нэхэмжлэхээ үүсгээрэй'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link href="/dashboard/billings/generate">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Нэхэмжлэх үүсгэх
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Дугаар
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Оршин суугч
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Байршил
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Сар
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Хугацаа
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Дүн
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Төлөв
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Үйлдэл
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBillings.map((billing) => {
                    const statusInfo = statusConfig[billing.status];
                    const StatusIcon = statusInfo.icon;
                    const isOverdue = billing.status === 'pending' && new Date(billing.due_date) < new Date();

                    return (
                      <tr key={billing.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-slate-600">{billing.billing_number || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{billing.tenant?.name || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p className="text-slate-900">{billing.unit?.property?.name}</p>
                            <p className="text-slate-500">{billing.unit?.unit_number}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {new Date(billing.billing_month).toLocaleDateString('mn-MN', {
                            year: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${isOverdue ? 'font-medium text-red-600' : 'text-slate-600'}`}>
                            {new Date(billing.due_date).toLocaleDateString('mn-MN')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-slate-900">₮{billing.total_amount.toLocaleString()}</p>
                          {billing.paid_amount > 0 && (
                            <p className="text-xs text-emerald-600">Төлсөн: ₮{billing.paid_amount.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                              isOverdue ? 'border-red-200 bg-red-50 text-red-700' : statusInfo.color
                            }`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue ? 'Хэтэрсэн' : statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Link href={`/dashboard/billings/${billing.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {billing.status !== 'cancelled' && billing.status !== 'paid' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(billing.id, billing.billing_number ?? null)}
                                disabled={cancelBilling.isPending}
                                className="h-8 w-8 p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                                title="Цуцлах"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(billing.id, billing.billing_number ?? null)}
                              disabled={deleteBilling.isPending}
                              className="h-8 w-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Устгах"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 lg:hidden">
              {filteredBillings.map((billing) => {
                const statusInfo = statusConfig[billing.status];
                const StatusIcon = statusInfo.icon;
                const isOverdue = billing.status === 'pending' && new Date(billing.due_date) < new Date();

                return (
                  <Card key={billing.id} className="overflow-hidden border-slate-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-500">{billing.billing_number || '-'}</span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                isOverdue ? 'border-red-200 bg-red-50 text-red-700' : statusInfo.color
                              }`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {isOverdue ? 'Хэтэрсэн' : statusInfo.label}
                            </span>
                          </div>
                          <p className="mt-1 font-medium text-slate-900">{billing.tenant?.name || '-'}</p>
                          <p className="text-sm text-slate-500">
                            {billing.unit?.property?.name} · {billing.unit?.unit_number}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">₮{billing.total_amount.toLocaleString()}</p>
                          {billing.paid_amount > 0 && (
                            <p className="text-xs text-emerald-600">-₮{billing.paid_amount.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span>
                            {new Date(billing.billing_month).toLocaleDateString('mn-MN', {
                              year: 'numeric',
                              month: 'short',
                            })}
                          </span>
                          <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                            Хугацаа: {new Date(billing.due_date).toLocaleDateString('mn-MN')}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Link href={`/dashboard/billings/${billing.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          {billing.status !== 'cancelled' && billing.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancel(billing.id, billing.billing_number ?? null)}
                              disabled={cancelBilling.isPending}
                              className="h-8 w-8 p-0 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(billing.id, billing.billing_number ?? null)}
                            disabled={deleteBilling.isPending}
                            className="h-8 w-8 p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              Нийт <span className="font-medium text-slate-700">{totalCount}</span>-с{' '}
              <span className="font-medium text-slate-700">{currentPage * ITEMS_PER_PAGE + 1}</span> -{' '}
              <span className="font-medium text-slate-700">
                {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)}
              </span>{' '}
              харуулж байна
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="h-9 border-slate-200"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Өмнөх
              </Button>
              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <span className="font-medium text-slate-700">{currentPage + 1}</span>
                <span className="mx-1 text-slate-400">/</span>
                <span className="text-slate-500">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="h-9 border-slate-200"
              >
                Дараах
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
