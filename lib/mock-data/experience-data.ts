// Experience Demo Mock Data
// Realistic Mongolian property management data for demo purposes

import type {
  Company,
  Property,
  Unit,
  Tenant,
  Billing,
  BillingStatus,
  CompanyFeatures,
} from '@/types/database';

// Mock Company with all features enabled (Pro plan equivalent)
export const mockCompany: Company = {
  id: 'mock-company-id',
  name: 'Алтан Өргөө ХХК',
  email: 'info@altanurguu.mn',
  phone: '77001234',
  address: 'Улаанбаатар, Сүхбаатар дүүрэг, 1-р хороо',
  logo_url: undefined,
  company_type: 'apartment',
  features: {
    multi_property: true,
    floor_plan: true,
    meter_readings: true,
    variable_fees: true,
    custom_fee_types: true,
    lease_management: true,
    lease_documents: true,
    maintenance_basic: true,
    maintenance_vendor: true,
    tenant_portal: true,
    tenant_meter_submit: true,
    email_notifications: true,
    sms_notifications: true,
    reports_advanced: true,
    api_access: false,
  } as CompanyFeatures,
  settings: {
    currency: 'MNT',
    billing_day: 1,
    payment_due_days: 15,
    bank_name: 'Хаан банк',
    bank_account_number: '5012345678',
    bank_account_name: 'Алтан Өргөө ХХК',
  },
  is_active: true,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2025-01-10T00:00:00Z',
};

// Mock Properties (2 properties)
export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    company_id: 'mock-company-id',
    name: 'Номин Тауэр',
    property_type: 'apartment',
    address: 'Улаанбаатар, СБД, 8-р хороо, Энхтайваны өргөн чөлөө 54',
    description: '12 давхар, 48 айлын орон сууц',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    total_floors: 12,
    total_units: 48,
    floor_plan_enabled: true,
    is_active: true,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2025-01-10T00:00:00Z',
  },
  {
    id: 'prop-2',
    company_id: 'mock-company-id',
    name: 'Нарантуул Резиденс',
    property_type: 'apartment',
    address: 'Улаанбаатар, БЗД, 3-р хороо, Чингисийн өргөн чөлөө 15',
    description: '8 давхар, 32 айлын орон сууц',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    total_floors: 8,
    total_units: 32,
    floor_plan_enabled: true,
    is_active: true,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2025-01-05T00:00:00Z',
  },
];

// Mock Units (selection of units from both properties)
export const mockUnits: Unit[] = [
  // Номин Тауэр units
  { id: 'unit-1', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '101', floor: 1, area_sqm: 65, rooms: 2, monthly_rent: 850000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-2', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '102', floor: 1, area_sqm: 85, rooms: 3, monthly_rent: 1100000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-3', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '201', floor: 2, area_sqm: 65, rooms: 2, monthly_rent: 850000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-4', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '202', floor: 2, area_sqm: 85, rooms: 3, monthly_rent: 1100000, status: 'vacant', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-5', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '301', floor: 3, area_sqm: 65, rooms: 2, monthly_rent: 850000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-6', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '302', floor: 3, area_sqm: 85, rooms: 3, monthly_rent: 1100000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-7', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '401', floor: 4, area_sqm: 65, rooms: 2, monthly_rent: 850000, status: 'occupied', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'unit-8', property_id: 'prop-1', company_id: 'mock-company-id', unit_number: '402', floor: 4, area_sqm: 110, rooms: 4, monthly_rent: 1500000, status: 'vacant', is_active: true, created_at: '2024-01-20T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  // Нарантуул Резиденс units
  { id: 'unit-9', property_id: 'prop-2', company_id: 'mock-company-id', unit_number: '101', floor: 1, area_sqm: 55, rooms: 1, monthly_rent: 650000, status: 'occupied', is_active: true, created_at: '2024-03-15T00:00:00Z', updated_at: '2025-01-05T00:00:00Z' },
  { id: 'unit-10', property_id: 'prop-2', company_id: 'mock-company-id', unit_number: '102', floor: 1, area_sqm: 75, rooms: 2, monthly_rent: 900000, status: 'occupied', is_active: true, created_at: '2024-03-15T00:00:00Z', updated_at: '2025-01-05T00:00:00Z' },
  { id: 'unit-11', property_id: 'prop-2', company_id: 'mock-company-id', unit_number: '201', floor: 2, area_sqm: 55, rooms: 1, monthly_rent: 650000, status: 'occupied', is_active: true, created_at: '2024-03-15T00:00:00Z', updated_at: '2025-01-05T00:00:00Z' },
  { id: 'unit-12', property_id: 'prop-2', company_id: 'mock-company-id', unit_number: '202', floor: 2, area_sqm: 75, rooms: 2, monthly_rent: 900000, status: 'vacant', is_active: true, created_at: '2024-03-15T00:00:00Z', updated_at: '2025-01-05T00:00:00Z' },
];

// Mock Tenants
export const mockTenants: Tenant[] = [
  { id: 'tenant-1', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Батбаяр Ганболд', phone: '99001234', email: 'batbayar@email.mn', auth_email: '99001234@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-02-01T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-2', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Оюунчимэг Баатар', phone: '99005678', email: 'oyunaa@email.mn', auth_email: '99005678@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-02-15T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-3', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Энхбаатар Дорж', phone: '99009012', email: 'enkhbat@email.mn', auth_email: '99009012@tenant.propertyhub.mn', password_changed: false, is_active: true, created_at: '2024-03-01T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-4', company_id: 'mock-company-id', tenant_type: 'company', name: 'Номин ХХК', phone: '77112233', company_name: 'Номин ХХК', contact_person_name: 'Болормаа', contact_person_phone: '99112233', auth_email: '77112233@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-03-15T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-5', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Сарангэрэл Мөнх', phone: '99223344', email: 'sarangerel@email.mn', auth_email: '99223344@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-04-01T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-6', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Тэмүүлэн Бат', phone: '99334455', email: 'temuulen@email.mn', auth_email: '99334455@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-04-15T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-7', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Ганзориг Эрдэнэ', phone: '99445566', email: 'ganzorig@email.mn', auth_email: '99445566@tenant.propertyhub.mn', password_changed: false, is_active: true, created_at: '2024-05-01T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
  { id: 'tenant-8', company_id: 'mock-company-id', tenant_type: 'individual', name: 'Дэлгэрмаа Цэрэн', phone: '99556677', email: 'delgermaa@email.mn', auth_email: '99556677@tenant.propertyhub.mn', password_changed: true, is_active: true, created_at: '2024-05-15T00:00:00Z', updated_at: '2025-01-10T00:00:00Z' },
];

// Current month for billing
const currentDate = new Date();
const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

// Mock Billings
export const mockBillings: Billing[] = [
  // Current month billings
  { id: 'bill-1', tenant_id: 'tenant-1', unit_id: 'unit-1', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0001`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 950000, tax_amount: 0, total_amount: 950000, status: 'paid' as BillingStatus, paid_amount: 950000, paid_at: `${currentMonth}-10T10:00:00Z`, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-10T10:00:00Z` },
  { id: 'bill-2', tenant_id: 'tenant-2', unit_id: 'unit-2', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0002`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 1250000, tax_amount: 0, total_amount: 1250000, status: 'paid' as BillingStatus, paid_amount: 1250000, paid_at: `${currentMonth}-12T14:00:00Z`, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-12T14:00:00Z` },
  { id: 'bill-3', tenant_id: 'tenant-3', unit_id: 'unit-3', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0003`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 920000, tax_amount: 0, total_amount: 920000, status: 'pending' as BillingStatus, paid_amount: 0, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-01T00:00:00Z` },
  { id: 'bill-4', tenant_id: 'tenant-4', unit_id: 'unit-5', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0004`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 980000, tax_amount: 0, total_amount: 980000, status: 'partial' as BillingStatus, paid_amount: 500000, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-08T09:00:00Z` },
  { id: 'bill-5', tenant_id: 'tenant-5', unit_id: 'unit-6', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0005`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 1180000, tax_amount: 0, total_amount: 1180000, status: 'paid' as BillingStatus, paid_amount: 1180000, paid_at: `${currentMonth}-05T11:00:00Z`, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-05T11:00:00Z` },
  { id: 'bill-6', tenant_id: 'tenant-6', unit_id: 'unit-7', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0006`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 890000, tax_amount: 0, total_amount: 890000, status: 'pending' as BillingStatus, paid_amount: 0, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-01T00:00:00Z` },
  { id: 'bill-7', tenant_id: 'tenant-7', unit_id: 'unit-9', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0007`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 720000, tax_amount: 0, total_amount: 720000, status: 'paid' as BillingStatus, paid_amount: 720000, paid_at: `${currentMonth}-03T15:00:00Z`, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-03T15:00:00Z` },
  { id: 'bill-8', tenant_id: 'tenant-8', unit_id: 'unit-10', company_id: 'mock-company-id', billing_number: `INV-${currentMonth.replace('-', '')}-0008`, billing_month: currentMonth, issue_date: `${currentMonth}-01`, due_date: `${currentMonth}-15`, subtotal: 980000, tax_amount: 0, total_amount: 980000, status: 'overdue' as BillingStatus, paid_amount: 0, created_at: `${currentMonth}-01T00:00:00Z`, updated_at: `${currentMonth}-01T00:00:00Z` },
  // Last month billings (for report comparison)
  { id: 'bill-9', tenant_id: 'tenant-1', unit_id: 'unit-1', company_id: 'mock-company-id', billing_number: `INV-${lastMonthStr.replace('-', '')}-0001`, billing_month: lastMonthStr, issue_date: `${lastMonthStr}-01`, due_date: `${lastMonthStr}-15`, subtotal: 920000, tax_amount: 0, total_amount: 920000, status: 'paid' as BillingStatus, paid_amount: 920000, paid_at: `${lastMonthStr}-12T10:00:00Z`, created_at: `${lastMonthStr}-01T00:00:00Z`, updated_at: `${lastMonthStr}-12T10:00:00Z` },
  { id: 'bill-10', tenant_id: 'tenant-2', unit_id: 'unit-2', company_id: 'mock-company-id', billing_number: `INV-${lastMonthStr.replace('-', '')}-0002`, billing_month: lastMonthStr, issue_date: `${lastMonthStr}-01`, due_date: `${lastMonthStr}-15`, subtotal: 1200000, tax_amount: 0, total_amount: 1200000, status: 'paid' as BillingStatus, paid_amount: 1200000, paid_at: `${lastMonthStr}-10T14:00:00Z`, created_at: `${lastMonthStr}-01T00:00:00Z`, updated_at: `${lastMonthStr}-10T14:00:00Z` },
];

// Dashboard Statistics
export const mockDashboardStats = {
  propertyCount: 2,
  unitCount: 80,
  vacantCount: 3,
  tenantCount: 77,
  occupancyRate: 96.25,
};

// Financial Summary for current month
export const mockFinancialSummary = {
  total_billed: 7870000,
  total_paid: 4100000,
  total_outstanding: 3770000,
  overdue_count: 1,
  overdue_amount: 980000,
  collection_rate: 52.1,
  pending_count: 2,
  paid_count: 4,
  partial_count: 1,
  cancelled_count: 0,
};

// Previous month summary (for comparison in reports)
export const mockPrevFinancialSummary = {
  total_billed: 7500000,
  total_paid: 7500000,
  total_outstanding: 0,
  overdue_count: 0,
  overdue_amount: 0,
  collection_rate: 100,
  pending_count: 0,
  paid_count: 8,
  partial_count: 0,
  cancelled_count: 0,
};

// Monthly Report Data
export const mockMonthlyReport = {
  by_fee_type: [
    { fee_type_id: 'ft-1', fee_name: 'Түрээсийн төлбөр', total_amount: 6200000, count: 8 },
    { fee_type_id: 'ft-2', fee_name: 'Цэвэр усны төлбөр', total_amount: 480000, count: 8 },
    { fee_type_id: 'ft-3', fee_name: 'Халуун усны төлбөр', total_amount: 640000, count: 8 },
    { fee_type_id: 'ft-4', fee_name: 'Үйлчилгээний төлбөр', total_amount: 320000, count: 8 },
    { fee_type_id: 'ft-5', fee_name: 'Цахилгааны төлбөр', total_amount: 230000, count: 8 },
  ],
  by_property: [
    {
      property_id: 'prop-1',
      property_name: 'Номин Тауэр',
      total_billed: 5180000,
      total_paid: 2880000,
      outstanding: 2300000,
      unit_count: 48,
      occupied_count: 46,
    },
    {
      property_id: 'prop-2',
      property_name: 'Нарантуул Резиденс',
      total_billed: 2690000,
      total_paid: 1220000,
      outstanding: 1470000,
      unit_count: 32,
      occupied_count: 31,
    },
  ],
  overdue_tenants: [
    {
      tenant_id: 'tenant-8',
      tenant_name: 'Дэлгэрмаа Цэрэн',
      unit_number: '102',
      property_name: 'Нарантуул Резиденс',
      amount: 980000,
      due_date: `${currentMonth}-15`,
      days_overdue: Math.max(0, new Date().getDate() - 15),
    },
  ],
};

// Tenants with unit info for display
export const mockTenantsWithUnits = mockTenants.map((tenant, index) => {
  const unitIndex = index < mockUnits.filter(u => u.status === 'occupied').length ? index : 0;
  const unit = mockUnits.filter(u => u.status === 'occupied')[unitIndex];
  const property = mockProperties.find(p => p.id === unit?.property_id);

  return {
    ...tenant,
    unit: unit ? {
      id: unit.id,
      unit_number: unit.unit_number,
      property: property ? {
        id: property.id,
        name: property.name,
      } : undefined,
    } : undefined,
  };
});

// Billings with tenant and unit info for display
export const mockBillingsWithRelations = mockBillings.map(billing => {
  const tenant = mockTenants.find(t => t.id === billing.tenant_id);
  const unit = mockUnits.find(u => u.id === billing.unit_id);
  const property = mockProperties.find(p => p.id === unit?.property_id);

  return {
    ...billing,
    tenant: tenant ? { id: tenant.id, name: tenant.name, phone: tenant.phone } : undefined,
    unit: unit ? {
      id: unit.id,
      unit_number: unit.unit_number,
      property: property ? { id: property.id, name: property.name } : undefined,
    } : undefined,
  };
});

// Helper to get current month string
export const getCurrentMonth = () => currentMonth;

// Helper to format month for display
export const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const monthNames = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
                      '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];
  return `${year} оны ${monthNames[parseInt(month) - 1]}`;
};
