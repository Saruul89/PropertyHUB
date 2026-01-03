-- 00005_performance_indexes.sql
-- パフォーマンス最適化用インデックスと集計ビュー

-- ============================================
-- 1. 高頻度クエリ用インデックス
-- ============================================

-- 会社でフィルター（ほぼ全テーブル）
CREATE INDEX IF NOT EXISTS idx_properties_company ON properties(company_id);
CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id);
CREATE INDEX IF NOT EXISTS idx_tenants_company ON tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_billings_company ON billings(company_id);
CREATE INDEX IF NOT EXISTS idx_leases_company ON leases(company_id);

-- 物件でフィルター
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_units_property_status ON units(property_id, status);

-- 請求検索
CREATE INDEX IF NOT EXISTS idx_billings_month ON billings(billing_month);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_tenant ON billings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billings_company_month ON billings(company_id, billing_month);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON billings(due_date);

-- 契約検索
CREATE INDEX IF NOT EXISTS idx_leases_unit ON leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_status ON leases(status);
CREATE INDEX IF NOT EXISTS idx_leases_end_date ON leases(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leases_active ON leases(company_id) WHERE status = 'active';

-- メーター検索
CREATE INDEX IF NOT EXISTS idx_meter_readings_unit_fee ON meter_readings(unit_id, fee_type_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON meter_readings(reading_date DESC);

-- 支払い検索
CREATE INDEX IF NOT EXISTS idx_payments_billing ON payments(billing_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- 通知キュー
CREATE INDEX IF NOT EXISTS idx_notifications_queue_status ON notifications_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_company ON notifications_queue(company_id);

-- 監査ログ
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON admin_audit_logs(target_type, target_id);

-- 部屋料金
CREATE INDEX IF NOT EXISTS idx_unit_fees_unit ON unit_fees(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_fees_fee_type ON unit_fees(fee_type_id);

-- 入居者メーター提出
CREATE INDEX IF NOT EXISTS idx_tenant_meter_submissions_status ON tenant_meter_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_meter_submissions_unit ON tenant_meter_submissions(unit_id);

-- ドキュメント
CREATE INDEX IF NOT EXISTS idx_documents_lease ON documents(lease_id);
CREATE INDEX IF NOT EXISTS idx_documents_property ON documents(property_id);

-- Засвартай
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);


-- ============================================
-- 2. 集計用ビュー
-- ============================================

-- 物件統計ビュー
CREATE OR REPLACE VIEW properties_with_stats AS
SELECT
    p.id,
    p.company_id,
    p.name,
    p.property_type,
    p.address,
    p.description,
    p.image_url,
    p.total_floors,
    p.floor_plan_enabled,
    p.is_active,
    p.created_at,
    p.updated_at,
    COUNT(u.id) as total_units,
    COUNT(u.id) FILTER (WHERE u.status = 'occupied') as occupied_units,
    COUNT(u.id) FILTER (WHERE u.status = 'vacant') as vacant_units,
    COUNT(u.id) FILTER (WHERE u.status = 'maintenance') as maintenance_units
FROM properties p
LEFT JOIN units u ON u.property_id = p.id AND u.is_active = true
GROUP BY p.id;

-- 請求サマリービュー（会社別・月別）
CREATE OR REPLACE VIEW billing_summary AS
SELECT
    company_id,
    billing_month,
    COUNT(*) as total_count,
    SUM(total_amount) as total_amount,
    SUM(paid_amount) as paid_amount,
    SUM(total_amount - paid_amount) as outstanding_amount,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
FROM billings
GROUP BY company_id, billing_month;

-- 入居者詳細ビュー（契約情報込み）
CREATE OR REPLACE VIEW tenants_with_lease AS
SELECT
    t.*,
    l.id as lease_id,
    l.unit_id,
    l.monthly_rent as lease_monthly_rent,
    l.start_date as lease_start_date,
    l.end_date as lease_end_date,
    l.status as lease_status,
    u.unit_number,
    u.property_id,
    p.name as property_name
FROM tenants t
LEFT JOIN leases l ON l.tenant_id = t.id AND l.status = 'active'
LEFT JOIN units u ON u.id = l.unit_id
LEFT JOIN properties p ON p.id = u.property_id;

-- 会社統計ビュー（システム管理者用）
CREATE OR REPLACE VIEW company_stats AS
SELECT
    c.*,
    (SELECT COUNT(*) FROM properties WHERE company_id = c.id AND is_active = true) as property_count,
    (SELECT COUNT(*) FROM units WHERE company_id = c.id AND is_active = true) as unit_count,
    (SELECT COUNT(*) FROM tenants WHERE company_id = c.id AND is_active = true) as tenant_count,
    (SELECT COUNT(*) FROM leases WHERE company_id = c.id AND status = 'active') as active_lease_count,
    (SELECT COALESCE(SUM(total_amount), 0) FROM billings WHERE company_id = c.id AND billing_month = date_trunc('month', CURRENT_DATE)::date) as current_month_billing,
    (SELECT COALESCE(SUM(paid_amount), 0) FROM billings WHERE company_id = c.id AND billing_month = date_trunc('month', CURRENT_DATE)::date) as current_month_paid,
    s.plan as subscription_plan,
    s.status as subscription_status,
    s.max_properties,
    s.max_units
FROM companies c
LEFT JOIN subscriptions s ON s.company_id = c.id AND s.status IN ('active', 'trial');

-- 部屋詳細ビュー（入居者情報込み）
CREATE OR REPLACE VIEW units_with_tenant AS
SELECT
    u.*,
    p.name as property_name,
    l.id as lease_id,
    l.tenant_id,
    l.monthly_rent as lease_monthly_rent,
    t.name as tenant_name,
    t.phone as tenant_phone,
    t.tenant_type
FROM units u
LEFT JOIN properties p ON p.id = u.property_id
LEFT JOIN leases l ON l.unit_id = u.id AND l.status = 'active'
LEFT JOIN tenants t ON t.id = l.tenant_id;

-- ダッシュボード用集計関数
CREATE OR REPLACE FUNCTION get_company_dashboard_stats(p_company_id UUID)
RETURNS TABLE (
    total_properties BIGINT,
    total_units BIGINT,
    occupied_units BIGINT,
    vacant_units BIGINT,
    total_tenants BIGINT,
    current_month_billing NUMERIC,
    current_month_paid NUMERIC,
    outstanding_amount NUMERIC,
    overdue_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM properties WHERE company_id = p_company_id AND is_active = true),
        (SELECT COUNT(*) FROM units WHERE company_id = p_company_id AND is_active = true),
        (SELECT COUNT(*) FROM units WHERE company_id = p_company_id AND is_active = true AND status = 'occupied'),
        (SELECT COUNT(*) FROM units WHERE company_id = p_company_id AND is_active = true AND status = 'vacant'),
        (SELECT COUNT(*) FROM tenants WHERE company_id = p_company_id AND is_active = true),
        (SELECT COALESCE(SUM(total_amount), 0) FROM billings WHERE company_id = p_company_id AND billing_month = date_trunc('month', CURRENT_DATE)::date),
        (SELECT COALESCE(SUM(paid_amount), 0) FROM billings WHERE company_id = p_company_id AND billing_month = date_trunc('month', CURRENT_DATE)::date),
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM billings WHERE company_id = p_company_id AND status IN ('pending', 'partial', 'overdue')),
        (SELECT COUNT(*) FROM billings WHERE company_id = p_company_id AND status = 'overdue');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- システム管理者用全体統計関数
CREATE OR REPLACE FUNCTION get_system_admin_stats()
RETURNS TABLE (
    total_companies BIGINT,
    active_companies BIGINT,
    total_properties BIGINT,
    total_units BIGINT,
    total_tenants BIGINT,
    total_billing_amount NUMERIC,
    total_paid_amount NUMERIC,
    total_outstanding NUMERIC,
    overdue_count BIGINT,
    active_subscriptions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM companies),
        (SELECT COUNT(*) FROM companies WHERE is_active = true),
        (SELECT COUNT(*) FROM properties WHERE is_active = true),
        (SELECT COUNT(*) FROM units WHERE is_active = true),
        (SELECT COUNT(*) FROM tenants WHERE is_active = true),
        (SELECT COALESCE(SUM(total_amount), 0) FROM billings WHERE billing_month = date_trunc('month', CURRENT_DATE)::date),
        (SELECT COALESCE(SUM(paid_amount), 0) FROM billings WHERE billing_month = date_trunc('month', CURRENT_DATE)::date),
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM billings WHERE status IN ('pending', 'partial', 'overdue')),
        (SELECT COUNT(*) FROM billings WHERE status = 'overdue'),
        (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trial'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 3. RLSポリシー for ビュー
-- ============================================

-- 注意: ビューにはRLSが直接適用されないため、
-- 基底テーブルのRLSが適用される
-- セキュリティ関数を使用するビューは SECURITY DEFINER で作成
