// Admin Types for PropertyHub

// Системийн админы эрхийн түвшин
export type AdminRole = 'super' | 'admin' | 'support';

// Аудитын лог үйлдэл
export type AuditAction =
    | 'company_view'
    | 'company_edit'
    | 'company_suspend'
    | 'company_activate'
    | 'company_delete'
    | 'features_change'
    | 'subscription_change'
    | 'admin_create'
    | 'admin_edit'
    | 'admin_delete'
    | 'settings_change'
    | 'login'
    | 'logout';

// Аудитын логийн зорилтот төрөл
export type AuditTargetType = 'company' | 'admin' | 'settings' | 'subscription';

// Захиалгын статус
export type SubscriptionStatus = 'active' | 'trial' | 'past_due' | 'cancelled' | 'suspended';

// Захиалгын төлөвлөгөө
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

// Системийн админ
export interface SystemAdmin {
    id: string;
    user_id: string;
    role: AdminRole;
    is_active: boolean;
    name?: string;
    email?: string;
    created_at: string;
    updated_at?: string;
}

// Аудитын лог
export interface AdminAuditLog {
    id: string;
    admin_id?: string;
    admin_email: string;
    action: AuditAction;
    target_type?: AuditTargetType;
    target_id?: string;
    target_name?: string;
    old_value?: Record<string, unknown>;
    new_value?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    notes?: string;
    created_at: string;
}

// Системийн тохиргоо
export interface SystemSetting {
    key: string;
    value: unknown;
    description?: string;
    updated_at?: string;
    updated_by?: string;
}

// Төлөвлөгөөний тохиргоо
export interface PlanConfig {
    max_properties: number;
    max_units: number;
    price: number;
}

// Бүх төлөвлөгөөний тохиргоо
export interface PlansConfig {
    free: PlanConfig;
    basic: PlanConfig;
    pro: PlanConfig;
    enterprise: PlanConfig;
}

// Үндсэн төлбөрийн төрлийн тохиргоо
export interface DefaultFeeType {
    name: string;
    calculation_type: 'fixed' | 'metered' | 'per_sqm' | 'custom';
    default_amount?: number;
    default_unit_price?: number;
    unit_label?: string;
}

// Функцийн тугийн урьдчилсан тохиргоо
export interface FeaturePreset {
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

// Имэйл тохиргоо
export interface EmailSettings {
    from_email: string;
    from_name: string;
    reply_to?: string;
}

// Компани засах оролт
export interface CompanyEditInput {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
}

// Компани түр зогсоох оролт
export interface CompanySuspendInput {
    reason: string;
}

// Функцийн туг шинэчлэх оролт
export interface FeaturesUpdateInput {
    features: Partial<FeaturePreset>;
}

// Захиалга шинэчлэх оролт
export interface SubscriptionUpdateInput {
    plan?: SubscriptionPlan;
    price_per_month?: number;
    max_properties?: number;
    max_units?: number;
    status?: SubscriptionStatus;
    end_date?: string | null;
    notes?: string;
}

// Админ үүсгэх оролт
export interface AdminCreateInput {
    email: string;
    name: string;
    password: string;
    role: AdminRole;
}

// Админ засах оролт
export interface AdminEditInput {
    name?: string;
    role?: AdminRole;
    is_active?: boolean;
}

// Системийн тохиргоо оролт
export interface SystemSettingsInput {
    plans?: PlansConfig;
    default_fee_types?: DefaultFeeType[];
    feature_presets?: Record<SubscriptionPlan, FeaturePreset>;
    email_settings?: EmailSettings;
    maintenance_mode?: boolean;
}

// Хяналтын самбарын статистик
export interface AdminDashboardStats {
    total_companies: number;
    total_properties: number;
    total_units: number;
    total_tenants: number;
    total_billings_this_month: number;
    total_payments_this_month: number;
    total_unpaid: number;
    mrr: number;
    companies_by_plan: Record<SubscriptionPlan, number>;
    companies_by_type: Record<string, number>;
    new_companies_this_month: number;
    expiring_subscriptions: number;
    limit_exceeded_companies: number;
}

// Компанийн дэлгэрэнгүй (админд зориулсан)
export interface CompanyDetailForAdmin {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    company_type: string;
    features: FeaturePreset;
    settings: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    subscription?: {
        id: string;
        plan: SubscriptionPlan;
        price_per_month: number;
        status: SubscriptionStatus;
        max_properties: number;
        max_units: number;
        current_period_start?: string;
        current_period_end?: string;
        next_billing_date?: string;
    };
    stats: {
        property_count: number;
        unit_count: number;
        tenant_count: number;
        user_count: number;
    };
    users: Array<{
        id: string;
        email: string;
        role: string;
        last_sign_in_at?: string;
    }>;
}

// Аудитын лог шүүлтүүр
export interface AuditLogFilter {
    start_date?: string;
    end_date?: string;
    admin_id?: string;
    action?: AuditAction;
    target_type?: AuditTargetType;
    target_id?: string;
    limit?: number;
    offset?: number;
}

// API хариултын төрөл
export interface AdminApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Нэвтэрсэн админы мэдээлэл
export interface AuthenticatedAdmin {
    id: string;
    user_id: string;
    email: string;
    name?: string;
    role: AdminRole;
}
