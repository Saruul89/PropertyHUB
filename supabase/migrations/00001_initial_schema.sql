-- PropertyHub Database Schema
-- Version: 2.0

-- ============================================
-- 1. システム管理テーブル
-- ============================================

-- システム管理者
CREATE TABLE system_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_system_admins_user ON system_admins(user_id);

-- ============================================
-- 2. 管理会社テーブル
-- ============================================

-- 管理会社
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url TEXT,

    -- 会社タイプ（デフォルトテンプレート用）
    company_type VARCHAR(50) DEFAULT 'apartment', -- 'apartment', 'office'

    -- 機能フラグ（システム管理者が設定可能）
    features JSONB DEFAULT '{
        "multi_property": false,
        "floor_plan": false,
        "meter_readings": true,
        "variable_fees": true,
        "custom_fee_types": true,
        "lease_management": false,
        "lease_documents": false,
        "maintenance_basic": true,
        "maintenance_vendor": false,
        "tenant_portal": true,
        "tenant_meter_submit": true,
        "email_notifications": true,
        "sms_notifications": false,
        "reports_advanced": false,
        "api_access": false
    }',

    -- その他設定
    settings JSONB DEFAULT '{
        "currency": "MNT",
        "billing_day": 1,
        "payment_due_days": 15
    }',

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_companies_email ON companies(email);
CREATE INDEX idx_companies_active ON companies(is_active);
CREATE INDEX idx_companies_type ON companies(company_type);

-- サブスクリプション
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free', -- 'free', 'basic', 'standard', 'premium'
    price_per_month DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'MNT',
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
    current_period_start DATE,
    current_period_end DATE,
    next_billing_date DATE,
    max_properties INTEGER DEFAULT 1,
    max_units INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 管理会社ユーザー
CREATE TABLE company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(50) DEFAULT 'staff', -- 'admin', 'staff'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- ============================================
-- 3. 物件管理テーブル
-- ============================================

-- 物件
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    -- 基本情報
    name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL DEFAULT 'apartment', -- 'apartment', 'office'
    address TEXT NOT NULL,
    description TEXT,
    image_url TEXT,

    -- 建物情報
    total_floors INTEGER DEFAULT 1,
    total_units INTEGER DEFAULT 0, -- トリガーで自動計算

    -- フロアプラン
    floor_plan_enabled BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_active ON properties(is_active);

-- Давхар
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    floor_number INTEGER NOT NULL,
    name VARCHAR(100), -- "1F", "B1", "屋上"

    -- フロアプラン用
    plan_width INTEGER,
    plan_height INTEGER,
    plan_image_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(property_id, floor_number)
);

CREATE INDEX idx_floors_property ON floors(property_id);

-- 部屋/ユニット
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,

    -- 基本情報
    unit_number VARCHAR(50) NOT NULL,
    floor INTEGER,
    area_sqm DECIMAL(10,2),
    rooms INTEGER,

    -- 料金
    monthly_rent DECIMAL(15,2) DEFAULT 0,
    price_per_sqm DECIMAL(15,2),

    -- フロアプラン用（位置・サイズ）
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,

    -- ステータス
    status VARCHAR(50) DEFAULT 'vacant', -- 'vacant', 'occupied', 'maintenance', 'reserved'

    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_company ON units(company_id);
CREATE INDEX idx_units_floor ON units(floor_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_active ON units(is_active);

-- ============================================
-- 4. 入居者/テナント管理テーブル
-- ============================================

-- 入居者/テナント
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    -- テナント種別
    tenant_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'company'

    -- 個人情報
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL, -- ログインIDとして使用
    email VARCHAR(255), -- 実際のメール（任意）
    id_number VARCHAR(100),

    -- 法人情報（tenant_type = 'company' の場合）
    company_name VARCHAR(255),
    company_registration_number VARCHAR(100),
    contact_person_name VARCHAR(255),
    contact_person_phone VARCHAR(50),

    -- 緊急連絡先
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),

    -- 認証用（電話番号→偽装メール）
    auth_email VARCHAR(255), -- 例: 99001234@tenant.propertyhub.mn
    initial_password VARCHAR(255), -- 初期パスワード（管理会社に表示用）
    password_changed BOOLEAN DEFAULT false,

    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tenants_company ON tenants(company_id);
CREATE INDEX idx_tenants_user ON tenants(user_id);
CREATE INDEX idx_tenants_phone ON tenants(phone);
CREATE INDEX idx_tenants_auth_email ON tenants(auth_email);
CREATE INDEX idx_tenants_active ON tenants(is_active);

-- 契約
CREATE TABLE leases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    -- 契約期間
    start_date DATE NOT NULL,
    end_date DATE,

    -- 料金
    monthly_rent DECIMAL(15,2) NOT NULL,
    deposit DECIMAL(15,2) DEFAULT 0,
    payment_due_day INTEGER DEFAULT 1,

    -- ステータス
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'terminated', 'pending'

    -- 契約条件（詳細契約管理が有効な場合）
    terms JSONB DEFAULT '{}',

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_company ON leases(company_id);
CREATE INDEX idx_leases_status ON leases(status);

-- ============================================
-- 5. 料金管理テーブル
-- ============================================

-- 料金タイプ
CREATE TABLE fee_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    name VARCHAR(255) NOT NULL,
    calculation_type VARCHAR(50) NOT NULL, -- 'fixed', 'per_sqm', 'metered', 'custom'
    unit_label VARCHAR(50), -- "₮", "₮/m³", "₮/m²"
    default_amount DECIMAL(15,2) DEFAULT 0,
    default_unit_price DECIMAL(15,2), -- メーター用

    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_fee_types_company ON fee_types(company_id);
CREATE INDEX idx_fee_types_active ON fee_types(is_active);

-- 部屋別料金設定
CREATE TABLE unit_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    fee_type_id UUID REFERENCES fee_types(id) ON DELETE CASCADE NOT NULL,

    custom_amount DECIMAL(15,2),
    custom_unit_price DECIMAL(15,2),

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(unit_id, fee_type_id)
);

CREATE INDEX idx_unit_fees_unit ON unit_fees(unit_id);
CREATE INDEX idx_unit_fees_fee_type ON unit_fees(fee_type_id);

-- メーター読み取り
CREATE TABLE meter_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    fee_type_id UUID REFERENCES fee_types(id) ON DELETE CASCADE NOT NULL,

    reading_date DATE NOT NULL,
    previous_reading DECIMAL(15,3) NOT NULL,
    current_reading DECIMAL(15,3) NOT NULL,
    consumption DECIMAL(15,3) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,

    unit_price DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) GENERATED ALWAYS AS ((current_reading - previous_reading) * unit_price) STORED,

    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_meter_readings_unit ON meter_readings(unit_id);
CREATE INDEX idx_meter_readings_date ON meter_readings(reading_date);

-- 入居者メーター提出
CREATE TABLE tenant_meter_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    fee_type_id UUID REFERENCES fee_types(id) ON DELETE CASCADE NOT NULL,

    submitted_reading DECIMAL(15,3) NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    photo_url TEXT,
    notes TEXT,

    -- 承認
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- 承認後
    meter_reading_id UUID REFERENCES meter_readings(id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tenant_meter_submissions_tenant ON tenant_meter_submissions(tenant_id);
CREATE INDEX idx_tenant_meter_submissions_unit ON tenant_meter_submissions(unit_id);
CREATE INDEX idx_tenant_meter_submissions_status ON tenant_meter_submissions(status);

-- ============================================
-- 6. 請求・支払いテーブル
-- ============================================

-- 請求
CREATE TABLE billings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    billing_number VARCHAR(50),
    billing_month DATE NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,

    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,

    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'overdue', 'cancelled'
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_at TIMESTAMPTZ,

    pdf_url TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_billings_tenant ON billings(tenant_id);
CREATE INDEX idx_billings_unit ON billings(unit_id);
CREATE INDEX idx_billings_company ON billings(company_id);
CREATE INDEX idx_billings_month ON billings(billing_month);
CREATE INDEX idx_billings_status ON billings(status);

-- 請求明細
CREATE TABLE billing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID REFERENCES billings(id) ON DELETE CASCADE NOT NULL,
    fee_type_id UUID REFERENCES fee_types(id) ON DELETE SET NULL,

    fee_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(15,3) DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,

    meter_reading_id UUID REFERENCES meter_readings(id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_billing_items_billing ON billing_items(billing_id);

-- 支払い
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    billing_id UUID REFERENCES billings(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_month DATE,

    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'card'
    reference_number VARCHAR(100),

    status VARCHAR(50) DEFAULT 'completed',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payments_billing ON payments(billing_id);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================
-- 7. その他テーブル
-- ============================================

-- Засвартай
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    requested_by UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),

    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category VARCHAR(100),

    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'

    -- 業者情報
    vendor_name VARCHAR(255),
    vendor_phone VARCHAR(50),
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),

    scheduled_date DATE,
    completed_date DATE,

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_company ON maintenance_requests(company_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);

-- ドキュメント
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    lease_id UUID REFERENCES leases(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    mime_type VARCHAR(100),

    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_lease ON documents(lease_id);

-- 通知
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    recipient_type VARCHAR(50) NOT NULL, -- 'tenant', 'company_user'
    recipient_id UUID NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),

    type VARCHAR(50) NOT NULL, -- 'billing', 'reminder', 'maintenance', 'announcement'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    related_type VARCHAR(50),
    related_id UUID,

    channel VARCHAR(50) NOT NULL, -- 'email', 'sms', 'in_app'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'

    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_company ON notifications(company_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_status ON notifications(status);
