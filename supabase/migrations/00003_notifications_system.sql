-- =====================================================
-- 通知システム (Notifications System)
-- =====================================================

-- notifications_queue テーブル
CREATE TABLE IF NOT EXISTS notifications_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- 送信先
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('tenant', 'company_user')),
    recipient_id UUID NOT NULL,

    -- 通知内容
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'billing_issued',
        'payment_reminder',
        'overdue_notice',
        'payment_confirmed',
        'lease_expiring',
        'maintenance_update',
        'account_created'
    )),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),

    -- テンプレートデータ
    template_data JSONB NOT NULL DEFAULT '{}',

    -- ステータス
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,

    -- 送信制御
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- company_notification_settings テーブル
CREATE TABLE IF NOT EXISTS company_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,

    -- メール設定
    email_billing_issued BOOLEAN NOT NULL DEFAULT true,
    email_payment_reminder BOOLEAN NOT NULL DEFAULT true,
    email_overdue_notice BOOLEAN NOT NULL DEFAULT true,
    email_payment_confirmed BOOLEAN NOT NULL DEFAULT true,
    email_lease_expiring BOOLEAN NOT NULL DEFAULT true,

    -- SMS設定
    sms_payment_reminder BOOLEAN NOT NULL DEFAULT false,
    sms_overdue_notice BOOLEAN NOT NULL DEFAULT true,
    sms_account_created BOOLEAN NOT NULL DEFAULT true,

    -- 送信元設定
    sender_email TEXT,
    sender_name TEXT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_notifications_queue_company_id ON notifications_queue(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_status ON notifications_queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_scheduled_at ON notifications_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_recipient ON notifications_queue(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_type_channel ON notifications_queue(notification_type, channel);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_created_at ON notifications_queue(created_at);

-- 重複チェック用複合インデックス（レート制限）
CREATE INDEX IF NOT EXISTS idx_notifications_queue_duplicate_check
ON notifications_queue(company_id, recipient_id, notification_type, channel, status, created_at);

-- RLS ポリシー
ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_notification_settings ENABLE ROW LEVEL SECURITY;

-- notifications_queue RLS
CREATE POLICY "notifications_queue_select_policy" ON notifications_queue
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "notifications_queue_insert_policy" ON notifications_queue
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "notifications_queue_update_policy" ON notifications_queue
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

-- company_notification_settings RLS
CREATE POLICY "company_notification_settings_select_policy" ON company_notification_settings
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "company_notification_settings_insert_policy" ON company_notification_settings
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "company_notification_settings_update_policy" ON company_notification_settings
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- service_role用のポリシー（Cron処理用）
CREATE POLICY "notifications_queue_service_role_policy" ON notifications_queue
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "company_notification_settings_service_role_policy" ON company_notification_settings
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 自動updated_atトリガー
CREATE OR REPLACE FUNCTION update_company_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_notification_settings_updated_at
    BEFORE UPDATE ON company_notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_company_notification_settings_updated_at();

-- 古い通知キューのクリーンアップ用関数（30日以上前のsent/skipped通知を削除）
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications_queue
    WHERE status IN ('sent', 'skipped')
    AND created_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- コメント
COMMENT ON TABLE notifications_queue IS '通知送信キュー - email/SMS通知の送信管理';
COMMENT ON TABLE company_notification_settings IS '会社別通知設定 - 通知タイプごとの有効/無効設定';
COMMENT ON COLUMN notifications_queue.notification_type IS '通知タイプ: billing_issued, payment_reminder, overdue_notice, payment_confirmed, lease_expiring, maintenance_update, account_created';
COMMENT ON COLUMN notifications_queue.status IS 'ステータス: pending(待機), sent(送信済), failed(失敗), skipped(スキップ)';
COMMENT ON COLUMN notifications_queue.attempts IS '送信試行回数（最大3回まで）';
