'use client';

import { Header } from '@/components/layout/header';
import { useAuth, useFeature } from '@/hooks';
import { DashboardSkeleton } from '@/components/skeletons';
import {
  DashboardStats,
  FinancialSummaryCards,
  OverdueTenantsAlert,
  ExpiringLeasesAlert,
  MeterReadingsWidget,
  MaintenanceWidget,
  QuickActions,
} from '@/components/features/dashboard';
import { BillingStatusChart } from '@/components/features/reports/BillingStatusChart';
import { useBillingSummary, getCurrentMonth } from '@/hooks/queries';

export default function DashboardPage() {
  const { companyId, loading: authLoading } = useAuth();
  const hasLeaseManagement = useFeature('lease_management');
  const hasMeterReadings = useFeature('meter_readings');
  const hasMaintenanceBasic = useFeature('maintenance_basic');

  const currentMonth = getCurrentMonth();
  const { data: billingSummary } = useBillingSummary(companyId, currentMonth);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  const showWidgets = hasMeterReadings || hasMaintenanceBasic;

  return (
    <>
      <Header title="Хянах самбар" />
      <div className="space-y-6 p-4 md:p-6">
        {/* Core Stats */}
        <DashboardStats companyId={companyId} />

        {/* Financial Summary */}
        <FinancialSummaryCards companyId={companyId} />

        {/* Alerts Section */}
        <div className="grid gap-4 md:grid-cols-2">
          <OverdueTenantsAlert companyId={companyId} />
          {hasLeaseManagement ? (
            <ExpiringLeasesAlert companyId={companyId} />
          ) : (
            billingSummary && (
              <BillingStatusChart
                pendingCount={billingSummary.pending_count}
                partialCount={billingSummary.partial_count}
                paidCount={billingSummary.paid_count}
                overdueCount={billingSummary.overdue_count}
                cancelledCount={billingSummary.cancelled_count}
              />
            )
          )}
        </div>

        {/* Feature Widgets */}
        {showWidgets && (
          <div className="grid gap-4 md:grid-cols-2">
            {hasMeterReadings && <MeterReadingsWidget />}
            {hasMaintenanceBasic && <MaintenanceWidget companyId={companyId} />}
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </>
  );
}
