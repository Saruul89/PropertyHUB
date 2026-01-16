'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  Home,
  Receipt,
  TrendingUp,
  AlertCircle,
  Percent,
  Banknote,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  mockDashboardStats,
  mockFinancialSummary,
  mockMonthlyReport,
  mockCompany,
} from '@/lib/mock-data/experience-data';

// Experience Header (no auth required)
function ExperienceHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-10 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full bg-gray-50 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700 pr-1">
            {mockCompany.name}
          </span>
        </div>
      </div>
    </header>
  );
}

// Stats Card Component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
              {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Financial Card Component
function FinancialCard({
  icon: Icon,
  label,
  value,
  subLabel,
  borderColor,
  iconBg,
  iconColor,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subLabel?: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className={`text-xl font-bold ${valueColor || ''}`}>{value}</p>
            {subLabel && <p className="text-xs text-gray-400">{subLabel}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card
function QuickActionCard({
  icon: Icon,
  label,
  description,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-110`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function ExperienceDashboardPage() {
  const stats = mockDashboardStats;
  const summary = mockFinancialSummary;
  const overdueCount = mockMonthlyReport.overdue_tenants.length;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `₮${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `₮${(amount / 1000).toFixed(0)}K`;
    }
    return `₮${amount.toLocaleString()}`;
  };

  return (
    <>
      <ExperienceHeader title="Хянах самбар" />

      <div className="space-y-6 p-4 md:p-6">
        {/* Core Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Барилга"
            value={stats.propertyCount}
            href="/experience/properties"
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Home}
            label="Өрөө"
            value={stats.unitCount}
            subValue={`${stats.vacantCount} сул`}
            href="/experience/properties"
            color="from-purple-500 to-purple-600"
          />
          <StatCard
            icon={Users}
            label="Оршин суугч"
            value={stats.tenantCount}
            href="/experience/tenants"
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            icon={TrendingUp}
            label="Ачаалал"
            value={`${stats.occupancyRate}%`}
            href="/experience/reports"
            color="from-amber-500 to-amber-600"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FinancialCard
            icon={Banknote}
            label="Нийт нэхэмжлэл"
            value={formatCurrency(summary.total_billed)}
            subLabel={`${summary.pending_count + summary.paid_count + summary.partial_count} нэхэмжлэл`}
            borderColor="border-l-blue-500"
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <FinancialCard
            icon={TrendingUp}
            label="Төлөгдсөн"
            value={formatCurrency(summary.total_paid)}
            subLabel={`${summary.paid_count} төлөгдсөн`}
            borderColor="border-l-green-500"
            iconBg="bg-green-100"
            iconColor="text-green-600"
            valueColor="text-green-600"
          />
          <FinancialCard
            icon={AlertCircle}
            label="Үлдэгдэл"
            value={formatCurrency(summary.total_outstanding)}
            subLabel={`${summary.overdue_count} хугацаа хэтэрсэн`}
            borderColor="border-l-red-500"
            iconBg="bg-red-100"
            iconColor="text-red-600"
            valueColor="text-red-600"
          />
          <FinancialCard
            icon={Percent}
            label="Цуглуулалт"
            value={`${summary.collection_rate.toFixed(1)}%`}
            subLabel={`${summary.partial_count} хэсэгчлэн`}
            borderColor="border-l-purple-500"
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Alerts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Overdue Alert */}
          <Card className={overdueCount > 0 ? 'border-red-200 bg-red-50/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${overdueCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                Хугацаа хэтэрсэн төлбөр
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueCount > 0 ? (
                <div className="space-y-2">
                  {mockMonthlyReport.overdue_tenants.map((tenant) => (
                    <div key={tenant.tenant_id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{tenant.tenant_name}</p>
                        <p className="text-xs text-gray-500">{tenant.property_name} - {tenant.unit_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600">{formatCurrency(tenant.amount)}</p>
                        <p className="text-xs text-gray-500">{tenant.days_overdue} хоног</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Хугацаа хэтэрсэн төлбөр байхгүй</p>
              )}
            </CardContent>
          </Card>

          {/* Billing Status Chart placeholder */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                Нэхэмжлэлийн төлөв
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Төлөгдсөн</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(summary.paid_count / 8) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{summary.paid_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Хүлээгдэж буй</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(summary.pending_count / 8) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{summary.pending_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Хэсэгчлэн</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(summary.partial_count / 8) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{summary.partial_count}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Хугацаа хэтэрсэн</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${(summary.overdue_count / 8) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{summary.overdue_count}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Түргэн үйлдлүүд</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard
                icon={Building2}
                label="Барилга харах"
                description="Бүх барилгын жагсаалт"
                href="/experience/properties"
                color="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <QuickActionCard
                icon={Users}
                label="Оршин суугчид"
                description="Бүх оршин суугчид"
                href="/experience/tenants"
                color="bg-gradient-to-br from-emerald-500 to-emerald-600"
              />
              <QuickActionCard
                icon={Receipt}
                label="Нэхэмжлэл"
                description="Нэхэмжлэлийн жагсаалт"
                href="/experience/billings"
                color="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <QuickActionCard
                icon={BarChart3}
                label="Тайлан"
                description="Санхүүгийн тайлан"
                href="/experience/reports"
                color="bg-gradient-to-br from-amber-500 to-amber-600"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
