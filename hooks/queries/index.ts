// Query hooks barrel export
export { queryKeys } from './keys';
export { useDashboardStats, type DashboardStats } from './use-dashboard-stats';
export { useExpiringLeases, type ExpiringLease } from './use-expiring-leases';
export { useMaintenanceSummary, type MaintenanceSummary } from './use-maintenance-summary';
export {
  useTenants,
  useDeleteTenant,
  filterTenants,
  type TenantWithLease,
  type TenantFilters,
} from './use-tenants';
export {
  useLeases,
  useDeleteLease,
  filterLeases,
  getLeaseStats,
  getDaysUntilExpiry,
  type LeaseWithRelations,
  type LeaseFilters,
} from './use-leases';
export {
  useProperties,
  usePropertiesSimple,
  useDeleteProperty,
  filterProperties,
  type PropertyFilters,
} from './use-properties';
export {
  useBillings,
  useDeleteBilling,
  useCancelBilling,
  filterBillings,
  getBillingStats,
  type BillingWithDetails,
  type BillingFilters,
  type BillingListResult,
} from './use-billings';

// Notifications
export {
  useNotificationsQuery,
  useNotificationHistory,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getUnreadCount,
  type NotificationFilters,
  type NotificationHistoryFilters,
  type NotificationHistoryItem,
  type NotificationQueueStatus,
} from './use-notifications';

// Reports
export {
  useBillingSummary,
  useMonthlyReport,
  getCurrentMonth,
  formatMonth,
  navigateMonth,
  type BillingSummary,
  type MonthlyReport,
  type PropertyStats,
  type FeeTypeStats,
  type OverdueTenant,
} from './use-reports';

// Company Users
export {
  useCompanyUsers,
  useCreateCompanyUser,
  useUpdateCompanyUser,
  useDeleteCompanyUser,
} from './use-company-users';

// Notification Settings
export {
  useNotificationSettings,
  useUpdateNotificationSettings,
  type NotificationSettingsData,
} from './use-notification-settings';

// Tenant Portal
export {
  useTenantBillings,
  getTenantBillingStats,
  ITEMS_PER_PAGE as TENANT_BILLING_PAGE_SIZE,
  type BillingWithItems,
} from './use-tenant-billings';

// Meter Submissions
export {
  useMeterData,
  useSubmitMeterReading,
  type MeterTypeWithReading,
} from './use-meter-submit';

// Documents
export { useDocumentDownloadUrl } from './use-documents';

// Tenant Detail
export {
  useTenantDetail,
  type TenantDetailData,
  type LeaseWithDetails,
} from './use-tenant-detail';

// Payment Claims
export { useSubmitPaymentClaim } from './use-payment-claim';
