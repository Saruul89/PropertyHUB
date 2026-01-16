'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/hooks';
import { useTenantBillings, getTenantBillingStats, TENANT_BILLING_PAGE_SIZE, useSubmitPaymentClaim } from '@/hooks/queries';
import type { BillingStatus } from '@/types';
import {
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Banknote,
  AlertTriangle,
  FileText,
  QrCode,
} from 'lucide-react';
import { TenantBillingsSkeleton } from '@/components/skeletons';
import { PaymentQrDialog } from '@/components/features/billings';

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Төлөгдөөгүй', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  partial: { label: 'Хэсэгчлэн', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
  paid: { label: 'Төлөгдсөн', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  overdue: { label: 'Хэтэрсэн', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  cancelled: { label: 'Цуцлагдсан', color: 'bg-slate-50 text-slate-600 border-slate-200', icon: XCircle },
};

export default function TenantBillingsPage() {
  const { tenant, loading: tenantLoading } = useTenant();
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedBillingId, setSelectedBillingId] = useState<string | null>(null);

  const { data, isLoading: billingsLoading } = useTenantBillings(tenant?.id ?? null, currentPage);
  const submitPaymentClaim = useSubmitPaymentClaim();

  const billings = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / TENANT_BILLING_PAGE_SIZE);
  const stats = getTenantBillingStats(billings);

  const selectedBilling = billings.find((b) => b.id === selectedBillingId) ?? null;
  const loading = billingsLoading;

  const handlePaymentClaim = async () => {
    if (!selectedBilling || !tenant) return;
    const remainingAmount = selectedBilling.total_amount - selectedBilling.paid_amount;

    if (!confirm(`₮${remainingAmount.toLocaleString()} төлсөн гэж мэдэгдэх үү? Менежер баталгаажуулсны дараа төлөв өөрчлөгдөнө.`)) return;

    submitPaymentClaim.mutate(
      {
        billingId: selectedBilling.id,
        tenantId: tenant.id,
        amount: remainingAmount,
      },
      {
        onSuccess: () => {
          alert('Төлбөр төлсөн гэсэн мэдэгдэл амжилттай илгээгдлээ. Менежер баталгаажуулахыг хүлээнэ үү.');
          setSelectedBillingId(null);
        },
        onError: () => {
          alert('Алдаа гарлаа. Дахин оролдоно уу.');
        },
      }
    );
  };

  if (tenantLoading) {
    return <TenantBillingsSkeleton />;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 md:text-2xl">Нэхэмжлэхийн жагсаалт</h1>
        <p className="mt-1 text-sm text-slate-500">Таны бүх төлбөрийн мэдээлэл</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-600 text-white">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Нийт нэхэмжлэх</p>
                <p className="text-lg font-bold text-slate-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600">Төлөгдөөгүй</p>
                <p className="text-lg font-bold text-amber-700">{stats.unpaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-600">Төлөгдсөн</p>
                <p className="text-lg font-bold text-emerald-700">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white">
                <Banknote className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-red-600">Төлөх дүн</p>
                <p className="text-lg font-bold text-red-700">₮{stats.unpaidAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billings List */}
      {loading ? (
        <TenantBillingsSkeleton />
      ) : billings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Receipt className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-700">Нэхэмжлэх байхгүй</p>
            <p className="mt-1 text-sm text-slate-500">Танд одоогоор нэхэмжлэх ирээгүй байна</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {billings.map((billing) => {
            const statusInfo = statusConfig[billing.status];
            const StatusIcon = statusInfo.icon;
            const isOverdue = billing.status === 'pending' && new Date(billing.due_date) < new Date();

            return (
              <Card
                key={billing.id}
                className={`cursor-pointer overflow-hidden border-slate-200 transition-all hover:border-slate-300 hover:shadow-md ${
                  isOverdue ? 'border-l-4 border-l-red-500' : billing.status === 'paid' ? 'border-l-4 border-l-emerald-500' : ''
                }`}
                onClick={() => setSelectedBillingId(billing.id)}
              >
                <CardContent className="p-4">
                  {/* Mobile Layout */}
                  <div className="flex flex-col gap-3 sm:hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isOverdue
                              ? 'bg-red-100'
                              : billing.status === 'paid'
                                ? 'bg-emerald-100'
                                : 'bg-amber-100'
                          }`}
                        >
                          <Receipt
                            className={`h-5 w-5 ${
                              isOverdue
                                ? 'text-red-600'
                                : billing.status === 'paid'
                                  ? 'text-emerald-600'
                                  : 'text-amber-600'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {new Date(billing.billing_month).toLocaleDateString('mn-MN', {
                              year: 'numeric',
                              month: 'long',
                            })}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                              isOverdue ? 'border-red-200 bg-red-50 text-red-700' : statusInfo.color
                            }`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue ? 'Хэтэрсэн' : statusInfo.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">₮{billing.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                        Хугацаа: {new Date(billing.due_date).toLocaleDateString('mn-MN')}
                      </span>
                      {billing.paid_amount > 0 && billing.paid_amount < billing.total_amount && (
                        <span className="text-emerald-600">Төлсөн: ₮{billing.paid_amount.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden items-center justify-between sm:flex">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          isOverdue
                            ? 'bg-red-100'
                            : billing.status === 'paid'
                              ? 'bg-emerald-100'
                              : 'bg-amber-100'
                        }`}
                      >
                        <Receipt
                          className={`h-6 w-6 ${
                            isOverdue
                              ? 'text-red-600'
                              : billing.status === 'paid'
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {new Date(billing.billing_month).toLocaleDateString('mn-MN', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </p>
                        <p className="text-sm text-slate-500">
                          Төлөх хугацаа:{' '}
                          <span className={isOverdue ? 'font-medium text-red-600' : ''}>
                            {new Date(billing.due_date).toLocaleDateString('mn-MN')}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-slate-900">₮{billing.total_amount.toLocaleString()}</p>
                        {billing.paid_amount > 0 && billing.paid_amount < billing.total_amount && (
                          <p className="text-xs text-emerald-600">
                            Төлсөн: ₮{billing.paid_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${
                          isOverdue ? 'border-red-200 bg-red-50 text-red-700' : statusInfo.color
                        }`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {isOverdue ? 'Хэтэрсэн' : statusInfo.label}
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
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Нийт <span className="font-medium text-slate-700">{totalCount}</span>-с{' '}
            <span className="font-medium text-slate-700">{currentPage * TENANT_BILLING_PAGE_SIZE + 1}</span> -{' '}
            <span className="font-medium text-slate-700">
              {Math.min((currentPage + 1) * TENANT_BILLING_PAGE_SIZE, totalCount)}
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

      {/* Billing Detail Modal */}
      {selectedBilling && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedBillingId(null)}
        >
          <Card
            className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                {new Date(selectedBilling.billing_month).toLocaleDateString('mn-MN', {
                  year: 'numeric',
                  month: 'long',
                })}
                -ийн нэхэмжлэх
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBillingId(null)}
                className="h-8 w-8 rounded-full p-0 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[calc(90vh-80px)] space-y-4 overflow-y-auto p-4">
              {/* Status */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <span className="text-sm text-slate-600">Төлөв</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium ${
                    statusConfig[selectedBilling.status].color
                  }`}
                >
                  {statusConfig[selectedBilling.status].label}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Огноо</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(selectedBilling.issue_date).toLocaleDateString('mn-MN')}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Төлөх хугацаа</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(selectedBilling.due_date).toLocaleDateString('mn-MN')}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-900">Задаргаа</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Нэр
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Тоо
                        </th>
                        <th className="hidden px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 sm:table-cell">
                          Үнэ
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Дүн
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedBilling.billing_items?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2.5 text-slate-900">{item.fee_name}</td>
                          <td className="px-3 py-2.5 text-right text-slate-600">{item.quantity}</td>
                          <td className="hidden px-3 py-2.5 text-right text-slate-600 sm:table-cell">
                            ₮{item.unit_price.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                            ₮{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Дүн</span>
                  <span className="text-slate-700">₮{selectedBilling.subtotal.toLocaleString()}</span>
                </div>
                {selectedBilling.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Татвар</span>
                    <span className="text-slate-700">₮{selectedBilling.tax_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                  <span className="text-slate-900">Нийт дүн</span>
                  <span className="text-slate-900">₮{selectedBilling.total_amount.toLocaleString()}</span>
                </div>
                {selectedBilling.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-emerald-600">
                      <span>Төлсөн</span>
                      <span>₮{selectedBilling.paid_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-600">
                      <span>Үлдэгдэл</span>
                      <span>
                        ₮{(selectedBilling.total_amount - selectedBilling.paid_amount).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Claim Button */}
              {selectedBilling.status !== 'paid' && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handlePaymentClaim}
                  disabled={submitPaymentClaim.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {submitPaymentClaim.isPending ? 'Илгээж байна...' : 'Төлсөн гэж мэдэгдэх'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
