'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Receipt,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Home,
} from 'lucide-react';
import {
  mockBillings,
  mockTenants,
  mockUnits,
  mockProperties,
  mockFinancialSummary,
  mockCompany,
  getCurrentMonth,
  formatMonth,
} from '@/lib/mock-data/experience-data';
import type { BillingStatus } from '@/types/database';

// Experience Header
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

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Хүлээгдэж буй', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  partial: { label: 'Хэсэгчлэн', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: TrendingUp },
  paid: { label: 'Төлөгдсөн', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  overdue: { label: 'Хугацаа хэтэрсэн', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  cancelled: { label: 'Цуцлагдсан', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle },
};

export default function ExperienceBillingsPage() {
  const currentMonth = getCurrentMonth();
  const summary = mockFinancialSummary;

  // Filter billings for current month and add relations
  const currentMonthBillings = mockBillings
    .filter(b => b.billing_month === currentMonth)
    .map(billing => {
      const tenant = mockTenants.find(t => t.id === billing.tenant_id);
      const unit = mockUnits.find(u => u.id === billing.unit_id);
      const property = unit ? mockProperties.find(p => p.id === unit.property_id) : null;

      return {
        ...billing,
        tenant,
        unit,
        property,
      };
    });

  const formatCurrency = (amount: number) => `₮${amount.toLocaleString()}`;

  return (
    <>
      <ExperienceHeader title="Төлбөр нэхэмжлэх" />

      <div className="p-4 md:p-6">
        {/* Month indicator */}
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            {formatMonth(currentMonth)}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Нийт нэхэмжлэл</p>
                <p className="text-xl font-bold">{formatCurrency(summary.total_billed)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Төлөгдсөн</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.total_paid)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Үлдэгдэл</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(summary.total_outstanding)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Цуглуулалт</p>
                <p className="text-xl font-bold">{summary.collection_rate.toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Нэхэмжлэл №
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Оршин суугч
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Байршил
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дүн
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлсөн
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Төлөв
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentMonthBillings.map((billing) => {
                    const status = statusConfig[billing.status];
                    const StatusIcon = status.icon;

                    return (
                      <tr key={billing.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="font-mono text-sm text-gray-900">{billing.billing_number}</p>
                          <p className="text-xs text-gray-500">Due: {billing.due_date}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900">{billing.tenant?.name || '-'}</p>
                          <p className="text-sm text-gray-500">{billing.tenant?.phone || '-'}</p>
                        </td>
                        <td className="px-4 py-4">
                          {billing.unit && billing.property && (
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {billing.unit.unit_number}-р өрөө
                                </p>
                                <p className="text-xs text-gray-500">
                                  {billing.property.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(billing.total_amount)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className={`font-semibold ${billing.paid_amount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {formatCurrency(billing.paid_amount)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <Badge variant="outline" className={`${status.color} flex items-center gap-1`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info message about read-only */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Туршилтын горимд нэхэмжлэл үүсгэх, төлбөр бүртгэх боломжгүй.
            <a href="/register" className="text-amber-600 hover:underline ml-1">Бүртгүүлэх</a>
          </p>
        </div>
      </div>
    </>
  );
}
