# 01 - データベーススキーマ

## Claude Code Implementation Guide - Database Schema

---

## 1. 概要

### 1.1 設計原則

1. **マルチテナント**: すべてのデータは `company_id` で分離
2. **機能フラグ**: `company.features` で機能の ON/OFF 制御
3. **シンプル**: オーナー機能は削除、3 ユーザータイプのみ
4. **拡張性**: 将来の機能追加に対応できる設計

### 1.2 ER 図（全体）

```
                                    ┌─────────────────┐
                                    │  system_admins  │
                                    └─────────────────┘

┌─────────────────┐
│  subscriptions  │
└─────────────────┘
        │
        ▼
┌─────────────────┐                 ┌─────────────────┐
│   companies     │◄────────────────│  company_users  │
│  (+ features)   │                 └─────────────────┘
└─────────────────┘
        │
        ├───────────────┬───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
┌──────────────┐ ┌──────────────┐   ┌──────────────┐
│  properties  │ │  fee_types   │   │ notifications│
└──────────────┘ └──────────────┘   └──────────────┘
        │               │
        ▼               │
┌──────────────┐        │
│   floors     │        │
└──────────────┘        │
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│    units     │◄│  unit_fees   │
└──────────────┘ └──────────────┘
        │
        ├───────────────┬───────────────┬───────────────┐
        │               │               │               │
        ▼               ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   leases     │ │meter_readings│ │ maintenance  │ │  documents   │
└──────────────┘ └──────────────┘ │  _requests   │ └──────────────┘
        │               │         └──────────────┘
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────────────┐
│   tenants    │ │tenant_meter_submissions│
└──────────────┘ └──────────────────────┘
        │
        ▼
┌──────────────┐
│   billings   │
└──────────────┘
        │
        ├───────────────┐
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────┐
│billing_items │ │   payments   │
└──────────────┘ └──────────────┘
```

---

## 2. テーブル定義

### 2.1 システム管理テーブル

#### system_admins（システム管理者）

```sql
CREATE TABLE system_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_system_admins_user ON system_admins(user_id);
```

#### subscriptions（サブスクリプション）

```sql
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
```

---

### 2.2 管理会社テーブル

#### companies（管理会社）

```sql
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
```

**features の説明:**

| キー                | 説明                   | デフォルト(アパート) | デフォルト(Оффис) |
| ------------------- | ---------------------- | :------------------: | :---------------: |
| multi_property      | 複数物件管理           |        false         |       false       |
| floor_plan          | ビジュアルフロアプラン |        false         |       true        |
| meter_readings      | 水道メーター入力       |         true         |       false       |
| variable_fees       | 変動料金計算           |         true         |       false       |
| custom_fee_types    | カスタム料金タイプ     |         true         |       false       |
| lease_management    | 詳細契約管理           |        false         |       true        |
| lease_documents     | 契約書管理             |        false         |       true        |
| maintenance_basic   | 基本 Засвартай         |         true         |       true        |
| maintenance_vendor  | 業者管理               |        false         |       true        |
| tenant_portal       | 入居者ポータル         |         true         |       true        |
| tenant_meter_submit | 入居者メーター提出     |         true         |       false       |
| email_notifications | メール通知             |         true         |       true        |
| sms_notifications   | SMS 通知               |        false         |       false       |
| reports_advanced    | 詳細レポート           |        false         |       false       |
| api_access          | API 連携               |        false         |       false       |

#### company_users（管理会社ユーザー）

```sql
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
```

---

### 2.3 物件管理テーブル

#### properties（物件）

```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,

    -- 基本情報
    name VARCHAR(255) NOT NULL,
    property_type VARCHAR(50) NOT NULL DEFAULT 'apartment', -- 'apartment', 'office' (ラベルのみ)
    address TEXT NOT NULL,
    description TEXT,
    image_url TEXT,

    -- 建物情報
    total_floors INTEGER DEFAULT 1,
    total_units INTEGER DEFAULT 0, -- トリガーで自動計算

    -- フロアプラン（Оффис用）
    floor_plan_enabled BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_active ON properties(is_active);
```

#### floors（Давхар）

```sql
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
```

#### units（部屋/ユニット）

```sql
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
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

    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(property_id, unit_number)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_floor ON units(floor_id);
CREATE INDEX idx_units_status ON units(status);
```

---

### 2.4 入居者/テナント管理テーブル

#### tenants（入居者/テナント）

```sql
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
```

#### leases（契約）

```sql
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
```

---

### 2.5 料金管理テーブル

#### fee_types（料金タイプ）

```sql
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
```

#### unit_fees（部屋別料金設定）

```sql
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
```

#### meter_readings（メーター読み取り）

```sql
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
```

#### tenant_meter_submissions（入居者メーター提出）

```sql
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
```

---

### 2.6 請求・支払いテーブル

#### billings（請求）

```sql
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
```

#### billing_items（請求明細）

```sql
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
```

#### payments（支払い）

```sql
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
```

---

### 2.7 その他テーブル

#### maintenance_requests（Засвартай）

```sql
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

    -- 業者情報（maintenance_vendor機能がONの場合）
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
```

#### documents（ドキュメント）

```sql
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
```

#### notifications（通知）

```sql
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
```

---

## 3. RLS ポリシー

### 3.1 ヘルパー関数

```sql
-- ユーザーの会社ID取得
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id FROM company_users
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 会社メンバーかチェック
CREATE OR REPLACE FUNCTION is_company_member(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM company_users
        WHERE user_id = auth.uid() AND company_id = check_company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- テナントかチェック
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM tenants
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- システム管理者かチェック
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM system_admins WHERE user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 主要ポリシー

```sql
-- すべてのテーブルでRLS有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
-- ... 他のテーブルも同様

-- companies
CREATE POLICY "Company members can view their company"
    ON companies FOR SELECT
    USING (is_company_member(id) OR is_system_admin());

CREATE POLICY "System admin can manage all companies"
    ON companies FOR ALL
    USING (is_system_admin());

-- properties
CREATE POLICY "Company members can manage properties"
    ON properties FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

-- tenants
CREATE POLICY "Company members can manage tenants"
    ON tenants FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own data"
    ON tenants FOR SELECT
    USING (user_id = auth.uid());

-- billings
CREATE POLICY "Company members can manage billings"
    ON billings FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own billings"
    ON billings FOR SELECT
    USING (tenant_id = get_tenant_id());
```

---

## 4. トリガー

### 4.1 updated_at 自動更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルに適用
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ... 他のテーブルも同様
```

### 4.2 Өрөөний тоо 自動計算

```sql
CREATE OR REPLACE FUNCTION update_property_unit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties SET total_units = (
        SELECT COUNT(*) FROM units WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ) WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unit_count
    AFTER INSERT OR UPDATE OR DELETE ON units
    FOR EACH ROW EXECUTE FUNCTION update_property_unit_count();
```

### 4.3 会社タイプでデフォルト features 設定

```sql
CREATE OR REPLACE FUNCTION set_default_features()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_type = 'apartment' THEN
        NEW.features = '{
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
        }'::jsonb;
    ELSIF NEW.company_type = 'office' THEN
        NEW.features = '{
            "multi_property": false,
            "floor_plan": true,
            "meter_readings": false,
            "variable_fees": false,
            "custom_fee_types": false,
            "lease_management": true,
            "lease_documents": true,
            "maintenance_basic": true,
            "maintenance_vendor": true,
            "tenant_portal": true,
            "tenant_meter_submit": false,
            "email_notifications": true,
            "sms_notifications": false,
            "reports_advanced": false,
            "api_access": false
        }'::jsonb;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_company_features
    BEFORE INSERT ON companies
    FOR EACH ROW EXECUTE FUNCTION set_default_features();
```

---

## 5. TypeScript 型定義

```typescript
// types/database.ts

export type CompanyType = "apartment" | "office";
export type TenantType = "individual" | "company";
export type UnitStatus = "vacant" | "occupied" | "maintenance" | "reserved";
export type LeaseStatus = "active" | "expired" | "terminated" | "pending";
export type BillingStatus =
  | "pending"
  | "partial"
  | "paid"
  | "overdue"
  | "cancelled";
export type FeeCalculationType = "fixed" | "per_sqm" | "metered" | "custom";

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

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo_url?: string;
  company_type: CompanyType;
  features: CompanyFeatures;
  settings: {
    currency: string;
    billing_day: number;
    payment_due_days: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

export interface Unit {
  id: string;
  property_id: string;
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
  auth_email: string;
  initial_password?: string;
  password_changed: boolean;
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
  terms: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
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
}
```

---

**Document Version**: 2.0  
**Previous**: `00-MAIN.md`  
**Next**: `02-AUTH.md`
