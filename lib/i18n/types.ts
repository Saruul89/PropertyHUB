// lib/i18n/types.ts
// Type definitions for the translation system

export interface TranslationParams {
  [key: string]: string | number;
}

export interface CommonTranslations {
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  create: string;
  update: string;
  search: string;
  filter: string;
  export: string;
  import: string;
  download: string;
  upload: string;
  view: string;
  close: string;
  confirm: string;
  back: string;
  next: string;
  previous: string;
  submit: string;
  reset: string;
  clear: string;
  select: string;
  selectAll: string;
  deselectAll: string;
  loading: string;
  saving: string;
  processing: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  confirmDelete: string;
  confirmCancel: string;
  unsavedChanges: string;
  noData: string;
  noResults: string;
  empty: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  yes: string;
  no: string;
  all: string;
  none: string;
  other: string;
  total: string;
  subtotal: string;
}

export interface AuthTranslations {
  login: string;
  logout: string;
  register: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  rememberMe: string;
  forgotPassword: string;
  companyLogin: string;
  tenantLogin: string;
  adminLogin: string;
  loginSuccess: string;
  loginError: string;
  invalidCredentials: string;
  invalidPhone: string;
  accountDisabled: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  passwordChanged: string;
  passwordRequirements: string;
  initialPassword: string;
  pleaseChangePassword: string;
}

export interface NavTranslations {
  dashboard: string;
  properties: string;
  units: string;
  tenants: string;
  leases: string;
  billings: string;
  payments: string;
  meterReadings: string;
  maintenance: string;
  reports: string;
  settings: string;
  notifications: string;
  help: string;
  tenantPortal: string;
  myBillings: string;
  myUnit: string;
  submitMeter: string;
  admin: string;
  companies: string;
  systemSettings: string;
  auditLogs: string;
}

export interface Translations {
  common: CommonTranslations;
  auth: AuthTranslations;
  nav: NavTranslations;
  property: Record<string, unknown>;
  unit: Record<string, unknown>;
  tenant: Record<string, unknown>;
  lease: Record<string, unknown>;
  billing: Record<string, unknown>;
  payment: Record<string, unknown>;
  meter: Record<string, unknown>;
  feeType: Record<string, unknown>;
  maintenance: Record<string, unknown>;
  notification: Record<string, unknown>;
  admin: Record<string, unknown>;
  floorPlan: Record<string, unknown>;
  errors: Record<string, unknown>;
}
