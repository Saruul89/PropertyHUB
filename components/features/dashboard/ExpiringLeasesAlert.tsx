'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useExpiringLeases } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, ChevronRight } from 'lucide-react';

type ExpiringLeasesAlertProps = {
  companyId: string | null;
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
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const ExpiringLeasesAlert = ({ companyId }: ExpiringLeasesAlertProps) => {
  const { data: expiringLeases, isLoading } = useExpiringLeases(companyId, 30);

  if (isLoading) {
    return <AlertSkeleton />;
  }

  const leases = expiringLeases?.slice(0, 5) || [];
  const hasExpiring = leases.length > 0;

  const getDaysLabel = (days: number): { text: string; color: string } => {
    if (days <= 7) return { text: `${days} өдөр`, color: 'text-red-600 bg-red-100' };
    if (days <= 14) return { text: `${days} өдөр`, color: 'text-orange-600 bg-orange-100' };
    return { text: `${days} өдөр`, color: 'text-yellow-600 bg-yellow-100' };
  };

  return (
    <Card className={hasExpiring ? 'border-yellow-200 bg-yellow-50/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className={`h-4 w-4 ${hasExpiring ? 'text-yellow-500' : 'text-gray-400'}`} />
            Дуусах гэрээнүүд
          </CardTitle>
          {hasExpiring && (
            <Link
              href="/dashboard/leases"
              className="flex items-center gap-1 text-xs text-yellow-700 hover:underline"
            >
              Бүгдийг харах
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasExpiring ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 rounded-full bg-green-100 p-3">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">30 өдрийн дотор дуусах гэрээ байхгүй</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leases.map((lease) => {
              const daysInfo = getDaysLabel(lease.days_remaining);
              return (
                <div
                  key={lease.id}
                  className="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                    <FileText className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{lease.tenant_name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {lease.property_name} - {lease.unit_number}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${daysInfo.color}`}>
                    {daysInfo.text}
                  </span>
                </div>
              );
            })}
            {expiringLeases && expiringLeases.length > 5 && (
              <p className="pt-2 text-center text-xs text-gray-500">
                +{expiringLeases.length - 5} бусад
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
