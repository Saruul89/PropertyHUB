'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useMaintenanceSummary } from '@/hooks/queries';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, ChevronRight } from 'lucide-react';

type MaintenanceWidgetProps = {
  companyId: string | null;
};

export const MaintenanceWidget = ({ companyId }: MaintenanceWidgetProps) => {
  const { data: summary, isLoading } = useMaintenanceSummary(companyId);

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-orange-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasPending = (summary?.pending ?? 0) > 0 || (summary?.in_progress ?? 0) > 0;

  return (
    <Link href="/dashboard/maintenance">
      <Card
        className={`cursor-pointer border-l-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
          hasPending ? 'border-l-orange-500 bg-orange-50/30' : 'border-l-gray-300'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  hasPending ? 'bg-orange-100' : 'bg-gray-100'
                }`}
              >
                <Wrench className={`h-5 w-5 ${hasPending ? 'text-orange-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Засварын хүсэлт</p>
                {hasPending ? (
                  <div className="flex items-center gap-2 text-xs">
                    {summary?.pending ? (
                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-orange-700">
                        {summary.pending} хүлээгдэж буй
                      </span>
                    ) : null}
                    {summary?.in_progress ? (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                        {summary.in_progress} явагдаж буй
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Хүсэлт байхгүй</p>
                )}
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
