-- PropertyHub RLS Policies and Triggers
-- Version: 2.0

-- ============================================
-- 1. ヘルパー関数
-- ============================================

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

-- テナントID取得
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

-- ============================================
-- 2. トリガー関数
-- ============================================

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Өрөөний тоо自動計算
CREATE OR REPLACE FUNCTION update_property_unit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE properties SET total_units = (
        SELECT COUNT(*) FROM units WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    ) WHERE id = COALESCE(NEW.property_id, OLD.property_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 会社タイプでデフォルトfeatures設定
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

-- ============================================
-- 3. トリガー適用
-- ============================================

-- updated_at トリガー
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON fee_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON unit_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON billings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Өрөөний тооカウントトリガー
CREATE TRIGGER update_unit_count
    AFTER INSERT OR UPDATE OR DELETE ON units
    FOR EACH ROW EXECUTE FUNCTION update_property_unit_count();

-- デフォルトfeatures設定トリガー
CREATE TRIGGER set_company_features
    BEFORE INSERT ON companies
    FOR EACH ROW EXECUTE FUNCTION set_default_features();

-- ============================================
-- 4. RLS有効化
-- ============================================

ALTER TABLE system_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_meter_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLSポリシー
-- ============================================

-- system_admins
CREATE POLICY "System admins can view themselves"
    ON system_admins FOR SELECT
    USING (user_id = auth.uid());

-- companies
CREATE POLICY "Company members can view their company"
    ON companies FOR SELECT
    USING (is_company_member(id) OR is_system_admin());

CREATE POLICY "System admin can manage all companies"
    ON companies FOR ALL
    USING (is_system_admin());

CREATE POLICY "Allow insert during registration"
    ON companies FOR INSERT
    WITH CHECK (true);

-- subscriptions
CREATE POLICY "Company members can view their subscription"
    ON subscriptions FOR SELECT
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "System admin can manage subscriptions"
    ON subscriptions FOR ALL
    USING (is_system_admin());

CREATE POLICY "Allow insert during registration"
    ON subscriptions FOR INSERT
    WITH CHECK (true);

-- company_users
CREATE POLICY "Company members can view company users"
    ON company_users FOR SELECT
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Company admins can manage company users"
    ON company_users FOR ALL
    USING (
        (is_company_member(company_id) AND EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.user_id = auth.uid() AND cu.company_id = company_users.company_id AND cu.role = 'admin'
        ))
        OR is_system_admin()
    );

CREATE POLICY "Allow insert during registration"
    ON company_users FOR INSERT
    WITH CHECK (true);

-- properties
CREATE POLICY "Company members can manage properties"
    ON properties FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

-- floors
CREATE POLICY "Company members can manage floors"
    ON floors FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = floors.property_id AND is_company_member(p.company_id)
        )
        OR is_system_admin()
    );

-- units
CREATE POLICY "Company members can manage units"
    ON units FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = units.property_id AND is_company_member(p.company_id)
        )
        OR is_system_admin()
    );

-- tenants
CREATE POLICY "Company members can manage tenants"
    ON tenants FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own data"
    ON tenants FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Tenants can update own data"
    ON tenants FOR UPDATE
    USING (user_id = auth.uid());

-- leases
CREATE POLICY "Company members can manage leases"
    ON leases FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own leases"
    ON leases FOR SELECT
    USING (tenant_id = get_tenant_id());

-- fee_types
CREATE POLICY "Company members can manage fee types"
    ON fee_types FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

-- unit_fees
CREATE POLICY "Company members can manage unit fees"
    ON unit_fees FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = unit_fees.unit_id AND is_company_member(p.company_id)
        )
        OR is_system_admin()
    );

-- meter_readings
CREATE POLICY "Company members can manage meter readings"
    ON meter_readings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN properties p ON p.id = u.property_id
            WHERE u.id = meter_readings.unit_id AND is_company_member(p.company_id)
        )
        OR is_system_admin()
    );

-- tenant_meter_submissions
CREATE POLICY "Company members can manage submissions"
    ON tenant_meter_submissions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenants t
            WHERE t.id = tenant_meter_submissions.tenant_id AND is_company_member(t.company_id)
        )
        OR is_system_admin()
    );

CREATE POLICY "Tenants can submit meter readings"
    ON tenant_meter_submissions FOR INSERT
    WITH CHECK (tenant_id = get_tenant_id());

CREATE POLICY "Tenants can view own submissions"
    ON tenant_meter_submissions FOR SELECT
    USING (tenant_id = get_tenant_id());

-- billings
CREATE POLICY "Company members can manage billings"
    ON billings FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own billings"
    ON billings FOR SELECT
    USING (tenant_id = get_tenant_id());

-- billing_items
CREATE POLICY "Company members can manage billing items"
    ON billing_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM billings b
            WHERE b.id = billing_items.billing_id AND is_company_member(b.company_id)
        )
        OR is_system_admin()
    );

CREATE POLICY "Tenants can view own billing items"
    ON billing_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM billings b
            WHERE b.id = billing_items.billing_id AND b.tenant_id = get_tenant_id()
        )
    );

-- payments
CREATE POLICY "Company members can manage payments"
    ON payments FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own payments"
    ON payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM billings b
            WHERE b.id = payments.billing_id AND b.tenant_id = get_tenant_id()
        )
    );

-- maintenance_requests
CREATE POLICY "Company members can manage maintenance"
    ON maintenance_requests FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can create maintenance requests"
    ON maintenance_requests FOR INSERT
    WITH CHECK (tenant_id = get_tenant_id());

CREATE POLICY "Tenants can view own maintenance requests"
    ON maintenance_requests FOR SELECT
    USING (tenant_id = get_tenant_id());

-- documents
CREATE POLICY "Company members can manage documents"
    ON documents FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Tenants can view own documents"
    ON documents FOR SELECT
    USING (tenant_id = get_tenant_id());

-- notifications
CREATE POLICY "Company members can manage notifications"
    ON notifications FOR ALL
    USING (is_company_member(company_id) OR is_system_admin());

CREATE POLICY "Recipients can view own notifications"
    ON notifications FOR SELECT
    USING (
        (recipient_type = 'tenant' AND recipient_id = get_tenant_id())
        OR (recipient_type = 'company_user' AND recipient_id IN (
            SELECT id FROM company_users WHERE user_id = auth.uid()
        ))
    );

CREATE POLICY "Recipients can update own notifications"
    ON notifications FOR UPDATE
    USING (
        (recipient_type = 'tenant' AND recipient_id = get_tenant_id())
        OR (recipient_type = 'company_user' AND recipient_id IN (
            SELECT id FROM company_users WHERE user_id = auth.uid()
        ))
    );
