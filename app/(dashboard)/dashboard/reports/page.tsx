'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  Wallet,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MonthlyRevenueChart,
  BillingStatusChart,
  PropertyReportTable,
  OverdueTenantsTable,
} from '@/components/features/reports';

type BillingSummary = {
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  overdue_count: number;
  overdue_amount: number;
  pending_count: number;
  partial_count: number;
  paid_count: number;
  cancelled_count: number;
  collection_rate: number;
  month: string;
};

type PropertyStats = {
  property_id: string;
  property_name: string;
  total_billed: number;
  total_paid: number;
  billing_count: number;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
};

type FeeTypeStats = {
  fee_name: string;
  total_amount: number;
  count: number;
};

type OverdueTenant = {
  tenant_name: string;
  unit_number: string;
  property_name: string;
  total_amount: number;
  paid_amount: number;
  outstanding: number;
  due_date: string;
};

type MonthlyReport = {
  month: string;
  summary: {
    total_billed: number;
    total_paid: number;
    total_outstanding: number;
    collection_rate: number;
  };
  by_property: PropertyStats[];
  by_fee_type: FeeTypeStats[];
  overdue_tenants: OverdueTenant[];
};

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const monthNames = [
    '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
    '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар',
  ];
  return `${year} оны ${monthNames[parseInt(month) - 1]}`;
};

const navigateMonth = (currentMonth: string, direction: 'prev' | 'next'): string => {
  const [year, month] = currentMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export default function ReportsPage() {
  const { companyId } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');

  useEffect(() => {
    if (!companyId) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const [summaryRes, monthlyRes] = await Promise.all([
          fetch(`/api/reports/billing/summary?month=${selectedMonth}`),
          fetch(`/api/reports/billing/monthly?month=${selectedMonth}`),
        ]);

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.data);
        }

        if (monthlyRes.ok) {
          const monthlyData = await monthlyRes.json();
          setMonthlyReport(monthlyData.data);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [companyId, selectedMonth]);

  const handlePrevMonth = () => {
    setSelectedMonth(navigateMonth(selectedMonth, 'prev'));
  };

  const handleNextMonth = () => {
    const nextMonth = navigateMonth(selectedMonth, 'next');
    if (nextMonth <= getCurrentMonth()) {
      setSelectedMonth(nextMonth);
    }
  };

  const isCurrentMonth = selectedMonth === getCurrentMonth();

  return (
    <div className="space-y-6">
      <Header title="Тайлан" />

      <div className="px-4 md:px-6">
        {/* Month Selector */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center text-lg font-medium">
              {formatMonth(selectedMonth)}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Нийт нэхэмжлэл</CardTitle>
              <Wallet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '-' : `₮${(summary?.total_billed || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.pending_count || 0} хүлээгдэж буй
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Төлөгдсөн</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '-' : `₮${(summary?.total_paid || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.paid_count || 0} төлөгдсөн
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Үлдэгдэл</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loading ? '-' : `₮${(summary?.total_outstanding || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.overdue_count || 0} хугацаа хэтэрсэн
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Цуглуулалтын хувь</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  (summary?.collection_rate || 0) >= 80
                    ? 'text-green-600'
                    : (summary?.collection_rate || 0) >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {loading ? '-' : `${(summary?.collection_rate || 0).toFixed(1)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary?.partial_count || 0} хэсэгчлэн төлсөн
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different reports */}
        <Tabs defaultValue="revenue" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:w-auto md:grid-cols-none">
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden md:inline">Орлого</span>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden md:inline">Хугацаа хэтэрсэн</span>
            </TabsTrigger>
            <TabsTrigger value="property" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">Хөрөнгөөр</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
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
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <OverdueTenantsTable
                data={monthlyReport?.overdue_tenants || []}
                month={selectedMonth}
              />
            )}
          </TabsContent>

          <TabsContent value="property">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : (
              <PropertyReportTable
                data={monthlyReport?.by_property || []}
                month={selectedMonth}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
