'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardStats } from '@/hooks/queries';
import { StatCardsSkeleton } from '@/components/skeletons';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';

type DashboardStatsProps = {
  companyId: string | null;
};

export const DashboardStats = ({ companyId }: DashboardStatsProps) => {
  const { data: stats, isLoading } = useDashboardStats(companyId);

  const occupancyRate =
    stats && stats.unitCount > 0
      ? Math.round(((stats.unitCount - stats.vacantCount) / stats.unitCount) * 100)
      : 0;

  if (isLoading) {
    return <StatCardsSkeleton />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Link href="/dashboard/properties">
        <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-500/30">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Барилга</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.propertyCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card className="transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Өрөө</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">{stats?.unitCount ?? 0}</p>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  Сул {stats?.vacantCount ?? 0}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Link href="/dashboard/tenants">
        <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Түрээслэгч</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.tenantCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      <Card className="bg-slate-900 text-white transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">Эзэмшил</p>
              <p className="text-2xl font-bold">{occupancyRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
