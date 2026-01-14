'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useBillingSummary, getCurrentMonth } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Banknote, CreditCard, AlertCircle, TrendingUp } from 'lucide-react';

type FinancialSummaryCardsProps = {
  companyId: string | null;
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `₮${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₮${(amount / 1000).toFixed(0)}K`;
  }
  return `₮${amount.toLocaleString()}`;
};

const FinancialSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const FinancialSummaryCards = ({ companyId }: FinancialSummaryCardsProps) => {
  const currentMonth = getCurrentMonth();
  const { data: summary, isLoading } = useBillingSummary(companyId, currentMonth);

  if (isLoading) {
    return <FinancialSkeleton />;
  }

  if (!summary) {
    return null;
  }

  const hasOverdue = summary.overdue_count > 0;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-gray-500">Санхүүгийн тойм</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/billings">
          <Card className="cursor-pointer border-l-4 border-l-blue-500 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Banknote className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Нийт нэхэмжлэл</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(summary.total_billed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billings?status=paid">
          <Card className="cursor-pointer border-l-4 border-l-green-500 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Төлөгдсөн</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(summary.total_paid)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billings?status=overdue">
          <Card
            className={`cursor-pointer border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
              hasOverdue ? 'border-l-red-500 bg-red-50/50' : 'border-l-orange-500'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    hasOverdue ? 'bg-red-100' : 'bg-orange-100'
                  }`}
                >
                  <AlertCircle
                    className={`h-5 w-5 ${hasOverdue ? 'text-red-600' : 'text-orange-600'}`}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Үлдэгдэл</p>
                  <p
                    className={`text-xl font-bold ${
                      hasOverdue ? 'text-red-600' : 'text-orange-600'
                    }`}
                  >
                    {formatCurrency(summary.total_outstanding)}
                  </p>
                  {hasOverdue && (
                    <p className="text-xs text-red-500">{summary.overdue_count} хугацаа хэтэрсэн</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-l-4 border-l-purple-500 transition-all hover:-translate-y-0.5 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Цуглуулалт</p>
                <p className="text-xl font-bold text-purple-600">{summary.collection_rate}%</p>
                <p className="text-xs text-gray-400">
                  {summary.paid_count}/{summary.paid_count + summary.pending_count + summary.partial_count}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
