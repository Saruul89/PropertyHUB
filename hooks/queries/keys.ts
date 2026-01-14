// Centralized query key factory for TanStack Query
// This ensures consistent key structure across the application

export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (companyId: string) => [...queryKeys.dashboard.all, 'stats', companyId] as const,
    expiringLeases: (companyId: string, days: number) =>
      [...queryKeys.dashboard.all, 'expiring-leases', companyId, days] as const,
    maintenanceSummary: (companyId: string) =>
      [...queryKeys.dashboard.all, 'maintenance-summary', companyId] as const,
  },

  // Companies
  companies: {
    all: ['companies'] as const,
    detail: (id: string) => [...queryKeys.companies.all, id] as const,
  },

  // Properties
  properties: {
    all: ['properties'] as const,
    lists: () => [...queryKeys.properties.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.properties.lists(), companyId, filters] as const,
    details: () => [...queryKeys.properties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.properties.details(), id] as const,
  },

  // Tenants
  tenants: {
    all: ['tenants'] as const,
    lists: () => [...queryKeys.tenants.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.tenants.lists(), companyId, filters] as const,
    details: () => [...queryKeys.tenants.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tenants.details(), id] as const,
  },

  // Leases
  leases: {
    all: ['leases'] as const,
    lists: () => [...queryKeys.leases.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.leases.lists(), companyId, filters] as const,
    details: () => [...queryKeys.leases.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leases.details(), id] as const,
  },

  // Billings
  billings: {
    all: ['billings'] as const,
    lists: () => [...queryKeys.billings.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.billings.lists(), companyId, filters] as const,
    details: () => [...queryKeys.billings.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.billings.details(), id] as const,
  },

  // Units
  units: {
    all: ['units'] as const,
    lists: () => [...queryKeys.units.all, 'list'] as const,
    list: (propertyId: string) => [...queryKeys.units.lists(), propertyId] as const,
    details: () => [...queryKeys.units.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.units.details(), id] as const,
  },

  // Meter readings
  meterReadings: {
    all: ['meterReadings'] as const,
    lists: () => [...queryKeys.meterReadings.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.meterReadings.lists(), companyId, filters] as const,
  },

  // Maintenance
  maintenance: {
    all: ['maintenance'] as const,
    lists: () => [...queryKeys.maintenance.all, 'list'] as const,
    list: (companyId: string, filters?: Record<string, unknown>) =>
      [...queryKeys.maintenance.lists(), companyId, filters] as const,
    details: () => [...queryKeys.maintenance.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.maintenance.details(), id] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.notifications.lists(), filters] as const,
    history: (filters?: Record<string, unknown>) => [...queryKeys.notifications.all, 'history', filters] as const,
    settings: (companyId: string) => [...queryKeys.notifications.all, 'settings', companyId] as const,
  },

  // Reports
  reports: {
    all: ['reports'] as const,
    billingSummary: (companyId: string, range?: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'billing-summary', companyId, range] as const,
    monthly: (companyId: string, year: number) => [...queryKeys.reports.all, 'monthly', companyId, year] as const,
  },

  // Company Users
  companyUsers: {
    all: ['company-users'] as const,
    list: (companyId: string) => [...queryKeys.companyUsers.all, companyId] as const,
  },

  // Billing Generate
  billingGenerate: {
    all: ['billing-generate'] as const,
    data: (companyId: string) => [...queryKeys.billingGenerate.all, companyId] as const,
  },

  // Tenant Portal
  tenantPortal: {
    all: ['tenant-portal'] as const,
    billings: (tenantId: string, page: number) => ['tenant-portal', 'billings', tenantId, page] as const,
    meterTypes: (companyId: string) => ['tenant-portal', 'meter-types', companyId] as const,
    meterSubmissions: (tenantId: string) => ['tenant-portal', 'meter-submissions', tenantId] as const,
  },

  // Documents
  documents: {
    all: ['documents'] as const,
    downloadUrl: (id: string) => [...queryKeys.documents.all, 'download-url', id] as const,
  },
};
