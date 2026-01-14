'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthlyReport, getCurrentMonth } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, User, ChevronRight } from 'lucide-react';

type OverdueTenantsAlertProps = {
  companyId: string | null;
};

const formatCurrency = (amount: number): string => {
  return `₮${amount.toLocaleString()}`;
};

const AlertSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const OverdueTenantsAlert = ({ companyId }: OverdueTenantsAlertProps) => {
  const currentMonth = getCurrentMonth();
  const { data: report, isLoading } = useMonthlyReport(companyId, currentMonth);

  if (isLoading) {
    return <AlertSkeleton />;
  }

  const overdueTenants = report?.overdue_tenants?.slice(0, 5) || [];
  const hasOverdue = overdueTenants.length > 0;

  return (
    <Card className={hasOverdue ? 'border-red-200 bg-red-50/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-4 w-4 ${hasOverdue ? 'text-red-500' : 'text-gray-400'}`} />
            Хугацаа хэтэрсэн
          </CardTitle>
          {hasOverdue && (
            <Link
              href="/dashboard/billings?status=overdue"
              className="flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              Бүгдийг харах
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasOverdue ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 rounded-full bg-green-100 p-3">
              <AlertTriangle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Хугацаа хэтэрсэн төлбөр байхгүй</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overdueTenants.map((tenant, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{tenant.tenant_name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {tenant.property_name} - {tenant.unit_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(tenant.outstanding)}
                  </p>
                </div>
              </div>
            ))}
            {report?.overdue_tenants && report.overdue_tenants.length > 5 && (
              <p className="pt-2 text-center text-xs text-gray-500">
                +{report.overdue_tenants.length - 5} бусад
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
