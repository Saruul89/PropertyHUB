'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Percent,
  BarChart3,
} from 'lucide-react';
import {
  mockFinancialSummary,
  mockPrevFinancialSummary,
  mockMonthlyReport,
  mockCompany,
  getCurrentMonth,
  formatMonth,
} from '@/lib/mock-data/experience-data';

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

const getCollectionRateColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 50) return 'text-amber-600';
  return 'text-red-600';
};

const getCollectionRateBgColor = (rate: number): string => {
  if (rate >= 80) return 'bg-green-50 border-green-200';
  if (rate >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
};

export default function ExperienceReportsPage() {
  const currentMonth = getCurrentMonth();
  const summary = mockFinancialSummary;
  const prevSummary = mockPrevFinancialSummary;
  const report = mockMonthlyReport;

  const formatCurrency = (amount: number) => `₮${amount.toLocaleString()}`;

  // Calculate trends
  const trends = {
    billed: { value: summary.total_billed - prevSummary.total_billed, isUp: summary.total_billed >= prevSummary.total_billed },
    paid: { value: summary.total_paid - prevSummary.total_paid, isUp: summary.total_paid >= prevSummary.total_paid },
    rate: { value: summary.collection_rate - prevSummary.collection_rate, isUp: summary.collection_rate >= prevSummary.collection_rate },
  };

  const collectionRate = summary.collection_rate;

  return (
    <>
      <ExperienceHeader title="Тайлан" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Month indicator */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">
            {formatMonth(currentMonth)}
          </Badge>
          <p className="text-sm text-gray-500">
            Сүүлд шинэчлэгдсэн: {new Date().toLocaleTimeString('mn-MN')}
          </p>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Total Billed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Нийт нэхэмжлэл
              </CardTitle>
              <div className="rounded-full bg-blue-100 p-2">
                <Wallet className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold sm:text-2xl">
                {formatCurrency(summary.total_billed)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends.billed.isUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={trends.billed.isUp ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Math.abs(trends.billed.value))}
                </span>
                <span className="text-muted-foreground">
                  • {summary.pending_count} хүлээгдэж буй
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Paid */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Төлөгдсөн
              </CardTitle>
              <div className="rounded-full bg-green-100 p-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-green-600 sm:text-2xl">
                {formatCurrency(summary.total_paid)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends.paid.isUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={trends.paid.isUp ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Math.abs(trends.paid.value))}
                </span>
                <span className="text-muted-foreground">
                  • {summary.paid_count} төлөгдсөн
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Outstanding */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Үлдэгдэл
              </CardTitle>
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600 sm:text-2xl">
                {formatCurrency(summary.total_outstanding)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.overdue_count} хугацаа хэтэрсэн
              </p>
            </CardContent>
          </Card>

          {/* Collection Rate */}
          <Card className={`border-2 ${getCollectionRateBgColor(collectionRate)}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Цуглуулалт
              </CardTitle>
              <div className={`rounded-full p-2 ${collectionRate >= 80 ? 'bg-green-200' : collectionRate >= 50 ? 'bg-amber-200' : 'bg-red-200'}`}>
                <Percent className={`h-4 w-4 ${getCollectionRateColor(collectionRate)}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold sm:text-2xl ${getCollectionRateColor(collectionRate)}`}>
                {collectionRate.toFixed(1)}%
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends.rate.isUp ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={trends.rate.isUp ? 'text-green-600' : 'text-red-600'}>
                  {trends.rate.isUp ? '+' : ''}{trends.rate.value.toFixed(1)}%
                </span>
                <span className="text-muted-foreground">
                  • {summary.partial_count} хэсэгчлэн
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="revenue" className="flex items-center gap-2 px-4">
              <BarChart3 className="h-4 w-4" />
              <span>Орлого</span>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2 px-4">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Хугацаа хэтэрсэн</span>
              <span className="sm:hidden">Хэтэрсэн</span>
              {summary.overdue_count > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {summary.overdue_count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="property" className="flex items-center gap-2 px-4">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Хөрөнгөөр</span>
              <span className="sm:hidden">Хөрөнгө</span>
            </TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Төлбөрийн төрлөөр</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.by_fee_type.map((item, index) => {
                    const percentage = (item.total_amount / summary.total_billed) * 100;
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];

                    return (
                      <div key={item.fee_type_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.fee_name}</span>
                          <span className="text-sm text-gray-600">{formatCurrency(item.total_amount)}</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{percentage.toFixed(1)}% • {item.count} нэхэмжлэл</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Billing Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Нэхэмжлэлийн төлөв</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{summary.paid_count}</p>
                    <p className="text-sm text-gray-600">Төлөгдсөн</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{summary.pending_count}</p>
                    <p className="text-sm text-gray-600">Хүлээгдэж буй</p>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-600">{summary.partial_count}</p>
                    <p className="text-sm text-gray-600">Хэсэгчлэн</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{summary.overdue_count}</p>
                    <p className="text-sm text-gray-600">Хугацаа хэтэрсэн</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overdue Tab */}
          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Хугацаа хэтэрсэн төлбөр</CardTitle>
              </CardHeader>
              <CardContent>
                {report.overdue_tenants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Оршин суугч</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Байршил</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Дүн</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Хугацаа</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {report.overdue_tenants.map((tenant) => (
                          <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium">{tenant.tenant_name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-600">{tenant.property_name}</p>
                              <p className="text-xs text-gray-500">{tenant.unit_number}-р өрөө</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="font-semibold text-red-600">{formatCurrency(tenant.amount)}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                {tenant.days_overdue} хоног
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">Хугацаа хэтэрсэн төлбөр байхгүй</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Барилгаар</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Барилга</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Нийт</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Төлөгдсөн</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Үлдэгдэл</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ачаалал</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.by_property.map((prop) => {
                        const occupancy = ((prop.occupied_count / prop.unit_count) * 100).toFixed(1);
                        return (
                          <tr key={prop.property_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <p className="font-medium">{prop.property_name}</p>
                              <p className="text-xs text-gray-500">{prop.occupied_count}/{prop.unit_count} өрөө</p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatCurrency(prop.total_billed)}
                            </td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold">
                              {formatCurrency(prop.total_paid)}
                            </td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold">
                              {formatCurrency(prop.outstanding)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                {occupancy}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info message about read-only */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Туршилтын горимд тайлан татах боломжгүй.
            <a href="/register" className="text-amber-600 hover:underline ml-1">Бүртгүүлэх</a>
          </p>
        </div>
      </div>
    </>
  );
}
