'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useReportExport } from '@/hooks';
import {
  useBillingSummary,
  useMonthlyReport,
  getCurrentMonth,
  formatMonth,
  navigateMonth,
} from '@/hooks/queries';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Calendar,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MonthlyRevenueChart,
  BillingStatusChart,
  PropertyReportTable,
  OverdueTenantsTable,
} from '@/components/features/reports';
import { ChartSkeleton, TableSkeleton } from '@/components/skeletons';

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

export default function ReportsPage() {
  const { companyId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [activeTab, setActiveTab] = useState('revenue');

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useBillingSummary(companyId, selectedMonth);
  const { data: monthlyReport, isLoading: reportLoading, refetch: refetchReport } = useMonthlyReport(companyId, selectedMonth);
  const { exportPropertyReport, exportOverdueReport } = useReportExport();

  // Get previous month data for comparison
  const previousMonth = navigateMonth(selectedMonth, 'prev');
  const { data: prevSummary } = useBillingSummary(companyId, previousMonth);

  const loading = summaryLoading || reportLoading;

  const handlePrevMonth = () => {
    setSelectedMonth(navigateMonth(selectedMonth, 'prev'));
  };

  const handleNextMonth = () => {
    const nextMonth = navigateMonth(selectedMonth, 'next');
    if (nextMonth <= getCurrentMonth()) {
      setSelectedMonth(nextMonth);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && value <= getCurrentMonth()) {
      setSelectedMonth(value);
    }
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchReport();
  };

  const isCurrentMonth = selectedMonth === getCurrentMonth();

  // Calculate trends compared to previous month
  const trends = useMemo(() => {
    if (!summary || !prevSummary) return null;

    const billedDiff = summary.total_billed - (prevSummary.total_billed || 0);
    const paidDiff = summary.total_paid - (prevSummary.total_paid || 0);
    const rateDiff = (summary.collection_rate || 0) - (prevSummary.collection_rate || 0);

    return {
      billed: { value: billedDiff, isUp: billedDiff >= 0 },
      paid: { value: paidDiff, isUp: paidDiff >= 0 },
      rate: { value: rateDiff, isUp: rateDiff >= 0 },
    };
  }, [summary, prevSummary]);

  // Export reports to Excel based on active tab
  const handleExportAll = () => {
    if (activeTab === 'property' && monthlyReport?.by_property) {
      exportPropertyReport(monthlyReport.by_property, selectedMonth);
    } else if (activeTab === 'overdue' && monthlyReport?.overdue_tenants) {
      exportOverdueReport(monthlyReport.overdue_tenants, selectedMonth);
    } else {
      // Default: export summary as CSV (for revenue tab)
      const summaryData = [
        ['Тайлангийн хураангуй', formatMonth(selectedMonth)],
        [''],
        ['Нийт нэхэмжлэл', `₮${(summary?.total_billed || 0).toLocaleString()}`],
        ['Төлөгдсөн', `₮${(summary?.total_paid || 0).toLocaleString()}`],
        ['Үлдэгдэл', `₮${(summary?.total_outstanding || 0).toLocaleString()}`],
        ['Цуглуулалтын хувь', `${(summary?.collection_rate || 0).toFixed(1)}%`],
        [''],
        ['Нэхэмжлэлийн тоо', summary?.pending_count || 0],
        ['Төлөгдсөн тоо', summary?.paid_count || 0],
        ['Хугацаа хэтэрсэн', summary?.overdue_count || 0],
      ];

      const csvContent = summaryData.map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `report-summary-${selectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const collectionRate = summary?.collection_rate || 0;

  return (
    <>
      <Header
        title="Тайлан"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Шинэчлэх</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Татах</span>
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Month Selector - Improved */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              className="shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="month"
                value={selectedMonth}
                onChange={handleMonthChange}
                max={getCurrentMonth()}
                className="w-44 pl-10 text-center font-medium"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className="shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {!isCurrentMonth && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMonth(getCurrentMonth())}
                className="text-blue-600 hover:text-blue-700"
              >
                Энэ сар
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Сүүлд шинэчлэгдсэн: {new Date().toLocaleTimeString('mn-MN')}
          </p>
        </div>

        {/* Summary Stats Cards - Redesigned */}
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
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                ) : (
                  `₮${(summary?.total_billed || 0).toLocaleString()}`
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends?.billed && (
                  <>
                    {trends.billed.isUp ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={trends.billed.isUp ? 'text-green-600' : 'text-red-600'}>
                      ₮{Math.abs(trends.billed.value).toLocaleString()}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">
                  • {summary?.pending_count || 0} хүлээгдэж буй
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
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                ) : (
                  `₮${(summary?.total_paid || 0).toLocaleString()}`
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends?.paid && (
                  <>
                    {trends.paid.isUp ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={trends.paid.isUp ? 'text-green-600' : 'text-red-600'}>
                      ₮{Math.abs(trends.paid.value).toLocaleString()}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">
                  • {summary?.paid_count || 0} төлөгдсөн
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
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
                ) : (
                  `₮${(summary?.total_outstanding || 0).toLocaleString()}`
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.overdue_count || 0} хугацаа хэтэрсэн
              </p>
            </CardContent>
          </Card>

          {/* Collection Rate - Highlighted */}
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
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
                ) : (
                  `${collectionRate.toFixed(1)}%`
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {trends?.rate && (
                  <>
                    {trends.rate.isUp ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={trends.rate.isUp ? 'text-green-600' : 'text-red-600'}>
                      {trends.rate.isUp ? '+' : ''}{trends.rate.value.toFixed(1)}%
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">
                  • {summary?.partial_count || 0} хэсэгчлэн
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports - Improved */}
        <Tabs
          defaultValue="revenue"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="revenue" className="flex items-center gap-2 px-4">
              <BarChart3 className="h-4 w-4" />
              <span>Орлого</span>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2 px-4">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Хугацаа хэтэрсэн</span>
              <span className="sm:hidden">Хэтэрсэн</span>
              {(summary?.overdue_count || 0) > 0 && (
                <span className="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {summary?.overdue_count}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="property" className="flex items-center gap-2 px-4">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Хөрөнгөөр</span>
              <span className="sm:hidden">Хөрөнгө</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <ChartSkeleton height={300} />
                <ChartSkeleton height={280} />
              </div>
            ) : (
              <>
                <MonthlyRevenueChart
                  feeTypeData={monthlyReport?.by_fee_type || []}
                  totalBilled={summary?.total_billed || 0}
                  totalPaid={summary?.total_paid || 0}
                />
                <BillingStatusChart
                  pendingCount={summary?.pending_count || 0}
                  partialCount={summary?.partial_count || 0}
                  paidCount={summary?.paid_count || 0}
                  overdueCount={summary?.overdue_count || 0}
                  cancelledCount={summary?.cancelled_count || 0}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="overdue">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : (
              <OverdueTenantsTable data={monthlyReport?.overdue_tenants || []} month={selectedMonth} />
            )}
          </TabsContent>

          <TabsContent value="property">
            {loading ? (
              <TableSkeleton rows={5} />
            ) : (
              <PropertyReportTable data={monthlyReport?.by_property || []} month={selectedMonth} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
