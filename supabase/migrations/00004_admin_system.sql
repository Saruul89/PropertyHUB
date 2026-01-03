-- ============================================
-- 00004: システム管理者機能拡張
-- PropertyHub Admin System Enhancement
-- ============================================

-- ============================================
-- 1. system_admins テーブル拡張
-- ============================================

-- role カラム追加 ('super', 'admin', 'support')
ALTER TABLE system_admins
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin' NOT NULL;

-- is_active カラム追加
ALTER TABLE system_admins
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- name カラム追加（管理者名）
ALTER TABLE system_admins
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- email カラム追加（直接参照用）
ALTER TABLE system_admins
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- updated_at カラム追加
ALTER TABLE system_admins
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_system_admins_active ON system_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_system_admins_role ON system_admins(role);

-- ============================================
-- 2. admin_audit_logs テーブル作成
-- ============================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 操作者
    admin_id UUID REFERENCES system_admins(id) ON DELETE SET NULL,
    admin_email TEXT NOT NULL,

    -- 操作内容
    action TEXT NOT NULL,
    -- 'company_view', 'company_edit', 'company_suspend', 'company_activate',
    -- 'company_delete', 'features_change', 'subscription_change',
    -- 'admin_create', 'admin_edit', 'admin_delete',
    -- 'settings_change', 'login', 'logout'

    -- 対象
    target_type TEXT, -- 'company', 'admin', 'settings', 'subscription'
    target_id UUID,
    target_name TEXT,

    -- 変更内容
    old_value JSONB,
    new_value JSONB,

    -- メタデータ
    ip_address TEXT,
    user_agent TEXT,

    -- 備考
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);

-- ============================================
-- 3. system_settings テーブル作成
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES system_admins(id) ON DELETE SET NULL
);

-- 初期データ挿入
INSERT INTO system_settings (key, value, description) VALUES
(
    'plans',
    '{
        "free": {"max_properties": 1, "max_units": 50, "price": 0},
        "basic": {"max_properties": 5, "max_units": 200, "price": 50000},
        "pro": {"max_properties": 20, "max_units": 1000, "price": 150000},
        "enterprise": {"max_properties": -1, "max_units": -1, "price": 0}
    }',
    'サブスクリプションプラン設定'
),
(
    'default_fee_types',
    '[
        {"name": "管理費", "calculation_type": "fixed", "default_amount": 50000},
        {"name": "水道代", "calculation_type": "metered", "unit_label": "₮/m³", "default_unit_price": 2500},
        {"name": "電気代", "calculation_type": "metered", "unit_label": "₮/kWh", "default_unit_price": 150},
        {"name": "ゴミ代", "calculation_type": "fixed", "default_amount": 10000}
    ]',
    'デフォルト料金タイプ設定'
),
(
    'feature_presets',
    '{
        "free": {
            "multi_property": false,
            "floor_plan": false,
            "meter_readings": true,
            "variable_fees": false,
            "custom_fee_types": false,
            "lease_management": false,
            "lease_documents": false,
            "maintenance_basic": true,
            "maintenance_vendor": false,
            "tenant_portal": true,
            "tenant_meter_submit": false,
            "email_notifications": true,
            "sms_notifications": false,
            "reports_advanced": false,
            "api_access": false
        },
        "basic": {
            "multi_property": true,
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
        },
        "pro": {
            "multi_property": true,
            "floor_plan": true,
            "meter_readings": true,
            "variable_fees": true,
            "custom_fee_types": true,
            "lease_management": true,
            "lease_documents": true,
            "maintenance_basic": true,
            "maintenance_vendor": true,
            "tenant_portal": true,
            "tenant_meter_submit": true,
            "email_notifications": true,
            "sms_notifications": true,
            "reports_advanced": true,
            "api_access": false
        },
        "enterprise": {
            "multi_property": true,
            "floor_plan": true,
            "meter_readings": true,
            "variable_fees": true,
            "custom_fee_types": true,
            "lease_management": true,
            "lease_documents": true,
            "maintenance_basic": true,
            "maintenance_vendor": true,
            "tenant_portal": true,
            "tenant_meter_submit": true,
            "email_notifications": true,
            "sms_notifications": true,
            "reports_advanced": true,
            "api_access": true
        }
    }',
    'プラン別機能フラグプリセット'
),
(
    'email_settings',
    '{
        "from_email": "noreply@propertyhub.mn",
        "from_name": "PropertyHub",
        "reply_to": "support@propertyhub.mn"
    }',
    'メール送信設定'
),
(
    'maintenance_mode',
    'false',
    'Засвартайモード設定'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 4. RLS ポリシー設定
-- ============================================

-- admin_audit_logs RLS
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- システム管理者のみ閲覧可能
CREATE POLICY "admin_audit_logs_select_policy" ON admin_audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- システム管理者のみ挿入可能
CREATE POLICY "admin_audit_logs_insert_policy" ON admin_audit_logs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- system_settings RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- システム管理者のみ閲覧可能
CREATE POLICY "system_settings_select_policy" ON system_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );

-- super/admin のみ更新可能
CREATE POLICY "system_settings_update_policy" ON system_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role IN ('super', 'admin')
        )
    );

-- system_admins RLS強化
ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;

-- システム管理者のみ閲覧可能
DROP POLICY IF EXISTS "system_admins_select_policy" ON system_admins;
CREATE POLICY "system_admins_select_policy" ON system_admins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM system_admins sa
            WHERE sa.user_id = auth.uid()
            AND sa.is_active = true
        )
    );

-- super のみ挿入可能
DROP POLICY IF EXISTS "system_admins_insert_policy" ON system_admins;
CREATE POLICY "system_admins_insert_policy" ON system_admins
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super'
        )
    );

-- super のみ更新可能
DROP POLICY IF EXISTS "system_admins_update_policy" ON system_admins;
CREATE POLICY "system_admins_update_policy" ON system_admins
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super'
        )
    );

-- super のみ削除可能
DROP POLICY IF EXISTS "system_admins_delete_policy" ON system_admins;
CREATE POLICY "system_admins_delete_policy" ON system_admins
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM system_admins
            WHERE user_id = auth.uid()
            AND is_active = true
            AND role = 'super'
        )
    );

-- ============================================
-- 5. トリガー設定
-- ============================================

-- system_admins updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_system_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_admins_updated_at_trigger ON system_admins;
CREATE TRIGGER system_admins_updated_at_trigger
    BEFORE UPDATE ON system_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_system_admins_updated_at();

-- system_settings updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_settings_updated_at_trigger ON system_settings;
CREATE TRIGGER system_settings_updated_at_trigger
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================
-- 6. ヘルパー関数
-- ============================================

-- 現在のユーザーがシステム管理者かチェック
CREATE OR REPLACE FUNCTION is_system_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM system_admins
        WHERE user_id = auth.uid()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 現在のユーザーの管理者ロール取得
CREATE OR REPLACE FUNCTION get_admin_role()
RETURNS TEXT AS $$
DECLARE
    admin_role TEXT;
BEGIN
    SELECT role INTO admin_role
    FROM system_admins
    WHERE user_id = auth.uid()
    AND is_active = true;

    RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 管理者権限チェック（指定ロール以上か）
CREATE OR REPLACE FUNCTION has_admin_role(required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_role TEXT;
BEGIN
    SELECT role INTO current_role
    FROM system_admins
    WHERE user_id = auth.uid()
    AND is_active = true;

    IF current_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- super > admin > support の順
    CASE required_role
        WHEN 'support' THEN
            RETURN current_role IN ('super', 'admin', 'support');
        WHEN 'admin' THEN
            RETURN current_role IN ('super', 'admin');
        WHEN 'super' THEN
            RETURN current_role = 'super';
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. 会社削除用のヘルパー関数
-- ============================================

-- 会社と関連データを完全削除する関数
CREATE OR REPLACE FUNCTION delete_company_cascade(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 注意: 外部キー制約により、多くは CASCADE で自動削除される
    -- 明示的に削除する必要があるものだけ記述

    -- payments (billing_id への参照があるので先に削除)
    DELETE FROM payments WHERE company_id = p_company_id;

    -- billing_items は billings の CASCADE で削除
    -- billings
    DELETE FROM billings WHERE company_id = p_company_id;

    -- meter_readings (unit_id への参照)
    DELETE FROM meter_readings WHERE unit_id IN (
        SELECT id FROM units WHERE property_id IN (
            SELECT id FROM properties WHERE company_id = p_company_id
        )
    );

    -- tenant_meter_submissions
    DELETE FROM tenant_meter_submissions WHERE unit_id IN (
        SELECT id FROM units WHERE property_id IN (
            SELECT id FROM properties WHERE company_id = p_company_id
        )
    );

    -- unit_fees
    DELETE FROM unit_fees WHERE unit_id IN (
        SELECT id FROM units WHERE property_id IN (
            SELECT id FROM properties WHERE company_id = p_company_id
        )
    );

    -- leases
    DELETE FROM leases WHERE company_id = p_company_id;

    -- units は properties の CASCADE で削除
    -- floors は properties の CASCADE で削除
    -- properties
    DELETE FROM properties WHERE company_id = p_company_id;

    -- tenants (user_id を持つ場合は auth.users も考慮が必要)
    -- 注: Supabase Auth ユーザーの削除は別途 API 経由で行う必要がある
    DELETE FROM tenants WHERE company_id = p_company_id;

    -- company_users
    DELETE FROM company_users WHERE company_id = p_company_id;

    -- maintenance_requests
    DELETE FROM maintenance_requests WHERE company_id = p_company_id;

    -- documents
    DELETE FROM documents WHERE company_id = p_company_id;

    -- notifications
    DELETE FROM notifications WHERE company_id = p_company_id;

    -- notification_templates (会社ごとの場合)
    -- DELETE FROM notification_templates WHERE company_id = p_company_id;

    -- fee_types
    DELETE FROM fee_types WHERE company_id = p_company_id;

    -- subscriptions
    DELETE FROM subscriptions WHERE company_id = p_company_id;

    -- 最後に会社本体を削除
    DELETE FROM companies WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 完了
-- ============================================
