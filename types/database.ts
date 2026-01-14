// PropertyHub Type Definitions

export type CompanyType = 'apartment' | 'office';
export type TenantType = 'individual' | 'company';
export type UnitStatus = 'vacant' | 'occupied' | 'maintenance' | 'reserved';
export type LeaseStatus = 'active' | 'expired' | 'terminated' | 'pending';
export type BillingStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type FeeCalculationType = 'fixed' | 'per_sqm' | 'metered' | 'custom';
export type MeterSubmissionStatus = 'pending' | 'approved' | 'rejected';
export type MaintenancePriority = 'low' | 'normal' | 'high' | 'urgent';
export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type NotificationChannel = 'email' | 'sms' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'read';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card';
export type UserRole = 'system_admin' | 'company_admin' | 'company_staff' | 'tenant';

export interface CompanyFeatures {
    multi_property: boolean;
    floor_plan: boolean;
    meter_readings: boolean;
    variable_fees: boolean;
    custom_fee_types: boolean;
    lease_management: boolean;
    lease_documents: boolean;
    maintenance_basic: boolean;
    maintenance_vendor: boolean;
    tenant_portal: boolean;
    tenant_meter_submit: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    reports_advanced: boolean;
    api_access: boolean;
}

export interface CompanySettings {
    currency: string;
    billing_day: number;
    payment_due_days: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    business_hours?: string;
}

export interface Company {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    logo_url?: string;
    company_type: CompanyType;
    features: CompanyFeatures;
    settings: CompanySettings;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Subscription {
    id: string;
    company_id: string;
    plan: 'free' | 'basic' | 'standard' | 'premium';
    price_per_month: number;
    currency: string;
    status: 'active' | 'canceled' | 'past_due';
    current_period_start?: string;
    current_period_end?: string;
    next_billing_date?: string;
    max_properties: number;
    max_units: number;
    created_at: string;
    updated_at: string;
}

export interface CompanyUser {
    id: string;
    company_id: string;
    user_id: string;
    role: 'admin' | 'staff';
    is_active: boolean;
    user_email?: string;
    user_name?: string;
    user_phone?: string;
    initial_password?: string;
    created_at: string;
}

export interface Property {
    id: string;
    company_id: string;
    name: string;
    property_type: CompanyType;
    address: string;
    description?: string;
    image_url?: string;
    total_floors: number;
    total_units: number;
    floor_plan_enabled: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Floor {
    id: string;
    property_id: string;
    floor_number: number;
    name?: string;
    plan_width?: number;
    plan_height?: number;
    plan_image_url?: string;
    elements?: FloorElementData[];
    template?: FloorTemplate;
    created_at: string;
}

// Template for batch floor layout
export interface FloorTemplate {
    units: TemplateUnit[];
    elements: FloorElementData[];
}

export interface TemplateUnit {
    position_x: number;
    position_y: number;
    width: number;
    height: number;
    relative_index: number;
    area_sqm?: number;
}

// Floor element stored in floors.elements JSONB column
export interface FloorElementData {
    id: string;
    element_type: FloorElementType;
    direction: ElementDirection;
    position_x: number;
    position_y: number;
    width: number;
    height: number;
}

export interface Unit {
    id: string;
    property_id: string;
    company_id: string;
    floor_id?: string;
    unit_number: string;
    floor?: number;
    area_sqm?: number;
    rooms?: number;
    monthly_rent: number;
    price_per_sqm?: number;
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    status: UnitStatus;
    is_active: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Tenant {
    id: string;
    user_id?: string;
    company_id: string;
    tenant_type: TenantType;
    name: string;
    phone: string;
    email?: string;
    id_number?: string;
    company_name?: string;
    company_registration_number?: string;
    contact_person_name?: string;
    contact_person_phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    auth_email: string;
    initial_password?: string;
    password_changed: boolean;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Lease {
    id: string;
    unit_id: string;
    tenant_id: string;
    company_id: string;
    start_date: string;
    end_date?: string;
    monthly_rent: number;
    deposit: number;
    payment_due_day: number;
    status: LeaseStatus;
    terms: Record<string, unknown>;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface FeeType {
    id: string;
    company_id: string;
    name: string;
    calculation_type: FeeCalculationType;
    unit_label?: string;
    default_amount: number;
    default_unit_price?: number;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface UnitFee {
    id: string;
    unit_id: string;
    fee_type_id: string;
    custom_amount?: number;
    custom_unit_price?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface MeterReading {
    id: string;
    unit_id: string;
    fee_type_id: string;
    reading_date: string;
    previous_reading: number;
    current_reading: number;
    consumption: number;
    unit_price: number;
    total_amount: number;
    notes?: string;
    recorded_by?: string;
    created_at: string;
}

export interface TenantMeterSubmission {
    id: string;
    tenant_id: string;
    unit_id: string;
    fee_type_id: string;
    submitted_reading: number;
    submitted_at: string;
    photo_url?: string;
    notes?: string;
    status: MeterSubmissionStatus;
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
    meter_reading_id?: string;
    created_at: string;
}

export interface Billing {
    id: string;
    lease_id?: string;
    tenant_id: string;
    unit_id: string;
    company_id: string;
    billing_number?: string;
    billing_month: string;
    issue_date: string;
    due_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    status: BillingStatus;
    paid_amount: number;
    paid_at?: string;
    pdf_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface BillingItem {
    id: string;
    billing_id: string;
    fee_type_id?: string;
    fee_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    amount: number;
    meter_reading_id?: string;
    created_at: string;
}

export interface Payment {
    id: string;
    billing_id?: string;
    lease_id?: string;
    company_id: string;
    amount: number;
    payment_date: string;
    payment_month?: string;
    payment_method?: PaymentMethod;
    reference_number?: string;
    status: string;
    notes?: string;
    recorded_by?: string;
    created_at: string;
}

export interface MaintenanceRequest {
    id: string;
    unit_id: string;
    property_id: string;
    company_id: string;
    requested_by?: string;
    tenant_id?: string;
    title: string;
    description?: string;
    priority: MaintenancePriority;
    category?: string;
    status: MaintenanceStatus;
    vendor_name?: string;
    vendor_phone?: string;
    estimated_cost?: number;
    actual_cost?: number;
    scheduled_date?: string;
    completed_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MaintenanceWithRelations extends MaintenanceRequest {
    unit: Unit & { property: Property };
    tenant?: Tenant;
}

export interface Document {
    id: string;
    company_id: string;
    property_id?: string;
    unit_id?: string;
    lease_id?: string;
    tenant_id?: string;
    file_name: string;
    file_url: string;
    file_type?: string;
    file_size?: number;
    mime_type?: string;
    description?: string;
    uploaded_by?: string;
    created_at: string;
}

export interface Notification {
    id: string;
    company_id: string;
    recipient_type: 'tenant' | 'company_user';
    recipient_id: string;
    recipient_email?: string;
    recipient_phone?: string;
    type: 'billing' | 'reminder' | 'maintenance' | 'announcement';
    title: string;
    message: string;
    related_type?: string;
    related_id?: string;
    channel: NotificationChannel;
    status: NotificationStatus;
    sent_at?: string;
    read_at?: string;
    error_message?: string;
    created_at: string;
}

// API Input Types

export interface PropertyInput {
    name: string;
    property_type: CompanyType;
    address: string;
    description?: string;
    total_floors?: number;
}

export interface UnitInput {
    unit_number: string;
    floor?: number;
    area_sqm?: number;
    rooms?: number;
    monthly_rent?: number;
    status?: UnitStatus;
    notes?: string;
}

export interface BulkUnitInput {
    startFloor: number;
    endFloor: number;
    unitsPerFloor: number;
    prefix?: string;
}

export interface TenantInput {
    tenant_type: TenantType;
    name: string;
    phone: string;
    unitId?: string;
    company_name?: string;
    notes?: string;
}

export interface FeeTypeInput {
    name: string;
    calculation_type: FeeCalculationType;
    unit_label?: string;
    default_amount?: number;
    default_unit_price?: number;
    is_active?: boolean;
    display_order?: number;
}

export interface MeterReadingInput {
    unit_id: string;
    fee_type_id: string;
    reading_date: string;
    previous_reading: number;
    current_reading: number;
    unit_price: number;
    notes?: string;
}

export interface MeterBulkInput {
    property_id: string;
    fee_type_id: string;
    reading_date: string;
    readings: {
        unit_id: string;
        current_reading: number;
    }[];
}

export interface TenantMeterSubmissionInput {
    unit_id: string;
    fee_type_id: string;
    submitted_reading: number;
    photo_url?: string;
    notes?: string;
}

export interface UnitFeeInput {
    fee_type_id: string;
    custom_amount?: number;
    custom_unit_price?: number;
    is_active?: boolean;
}

// Floor Plan Input Types
export interface FloorInput {
    floor_number: number;
    name?: string;
    plan_width?: number;
    plan_height?: number;
    plan_image_url?: string;
}

export interface UnitPositionInput {
    position_x: number;
    position_y: number;
    width: number;
    height: number;
}

// Lease Management Input Types
export interface LeaseTerms {
    rent_increase_rate?: number;
    rent_increase_interval?: number;
    notice_period_days?: number;
    renewal_terms?: string;
    special_conditions?: string;
}

export interface LeaseInput {
    tenant_id: string;
    unit_id: string;
    start_date: string;
    end_date?: string;
    monthly_rent: number;
    deposit?: number;
    payment_due_day?: number;
    status: LeaseStatus;
    terms?: LeaseTerms;
    notes?: string;
}

export interface LeaseRenewInput {
    end_date?: string;
    monthly_rent?: number;
    terms?: LeaseTerms;
}

// Document Management Input Types
export interface DocumentUploadInput {
    description?: string;
    lease_id?: string;
    property_id?: string;
    unit_id?: string;
    tenant_id?: string;
}

// Maintenance Management Input Types
export interface MaintenanceInput {
    property_id: string;
    unit_id?: string;
    title: string;
    description?: string;
    priority: MaintenancePriority;
    category?: string;
    scheduled_date?: string;
    vendor_name?: string;
    vendor_phone?: string;
    estimated_cost?: number;
}

export interface MaintenanceCompleteInput {
    completed_date: string;
    actual_cost?: number;
    notes?: string;
}

export interface MaintenanceStatusInput {
    status: MaintenanceStatus;
}

// Billing Management Input Types
export interface BillingGenerateInput {
    billing_month: string;       // YYYY-MM
    property_ids?: string[];     // Хоосон = бүх барилга
    issue_date: string;          // YYYY-MM-DD
    due_date: string;            // YYYY-MM-DD
    lease_ids?: string[];        // Зөвхөн тодорхой гэрээнүүд
}

export interface BillingGeneratePreview {
    unit_id: string;
    unit_number: string;
    tenant_name: string;
    items: {
        fee_type_id?: string;
        fee_name: string;
        quantity: number;
        unit_price: number;
        amount: number;
    }[];
    total_amount: number;
}

export interface BillingInput {
    issue_date?: string;
    due_date?: string;
    notes?: string;
    status?: BillingStatus;
}

export interface BillingItemInput {
    fee_type_id?: string;
    fee_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface PaymentInput {
    amount: number;              // > 0
    payment_date: string;        // YYYY-MM-DD
    payment_method?: PaymentMethod;
    reference_number?: string;
    notes?: string;
}

export interface BillingSummary {
    total_billed: number;        // Нийт нэхэмжлэгдсэн дүн
    total_paid: number;          // Нийт төлсөн дүн
    total_outstanding: number;   // Төлөгдөөгүй дүн
    overdue_count: number;       // Хоцорсон тоо
    overdue_amount: number;      // Хоцорсон дүн
}

// Billing Constants
export const BILLING_STATUS = {
    PENDING: 'pending',      // Төлөгдөөгүй
    PARTIAL: 'partial',      // Хэсэгчлэн төлсөн
    PAID: 'paid',            // Төлсөн
    OVERDUE: 'overdue',      // Хоцорсон
    CANCELLED: 'cancelled',  // Цуцлагдсан
} as const;

export const PAYMENT_METHOD = {
    CASH: 'cash',
    BANK_TRANSFER: 'bank_transfer',
    CARD: 'card',
} as const;

export const BILLING_NUMBER_FORMAT = 'INV-{YYYYMM}-{0000}';
export const DEFAULT_DUE_DAYS = 15;

// Floor Element Types (stored in floors.elements JSONB column)
export type FloorElementType = 'door' | 'window' | 'stairs' | 'elevator';
export type ElementDirection = 'north' | 'south' | 'east' | 'west';

export interface FloorSaveInput {
    units: Array<{
        id: string;
        position_x: number;
        position_y: number;
        width: number;
        height: number;
        unit_number?: string;
        area_sqm?: number;
        status?: UnitStatus;
    }>;
    elements: FloorElementData[];
}
