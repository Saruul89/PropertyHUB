import { createAdminClient } from '@/lib/supabase/admin';
import {
    AuditAction,
    AuditTargetType,
    AuthenticatedAdmin,
} from '@/types/admin';

interface AuditLogParams {
    admin: AuthenticatedAdmin;
    action: AuditAction;
    targetType?: AuditTargetType;
    targetId?: string;
    targetName?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    notes?: string;
}

// 監査ログを記録する
export async function logAdminAction(params: AuditLogParams): Promise<void> {
    const {
        admin,
        action,
        targetType,
        targetId,
        targetName,
        oldValue,
        newValue,
        ipAddress,
        userAgent,
        notes,
    } = params;

    try {
        const supabase = createAdminClient();

        const { error } = await supabase.from('admin_audit_logs').insert({
            admin_id: admin.id,
            admin_email: admin.email,
            action,
            target_type: targetType,
            target_id: targetId,
            target_name: targetName,
            old_value: oldValue,
            new_value: newValue,
            ip_address: ipAddress,
            user_agent: userAgent,
            notes,
        });

        if (error) {
            console.error('Failed to create audit log:', error);
        }
    } catch (err) {
        // 監査ログの失敗は本体の処理を止めない
        console.error('Audit log error:', err);
    }
}

// 会社操作のログ記録
export async function logCompanyAction(
    admin: AuthenticatedAdmin,
    action: 'company_view' | 'company_edit' | 'company_suspend' | 'company_activate' | 'company_delete',
    companyId: string,
    companyName: string,
    options?: {
        oldValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
        notes?: string;
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action,
        targetType: 'company',
        targetId: companyId,
        targetName: companyName,
        ...options,
    });
}

// 機能フラグ変更のログ記録
export async function logFeaturesChange(
    admin: AuthenticatedAdmin,
    companyId: string,
    companyName: string,
    oldFeatures: Record<string, unknown>,
    newFeatures: Record<string, unknown>,
    options?: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action: 'features_change',
        targetType: 'company',
        targetId: companyId,
        targetName: companyName,
        oldValue: oldFeatures,
        newValue: newFeatures,
        ...options,
    });
}

// サブスクリプション変更のログ記録
export async function logSubscriptionChange(
    admin: AuthenticatedAdmin,
    companyId: string,
    companyName: string,
    oldSubscription: Record<string, unknown>,
    newSubscription: Record<string, unknown>,
    options?: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action: 'subscription_change',
        targetType: 'subscription',
        targetId: companyId,
        targetName: companyName,
        oldValue: oldSubscription,
        newValue: newSubscription,
        ...options,
    });
}

// 管理者操作のログ記録
export async function logAdminUserAction(
    admin: AuthenticatedAdmin,
    action: 'admin_create' | 'admin_edit' | 'admin_delete',
    targetAdminId: string,
    targetAdminName: string,
    options?: {
        oldValue?: Record<string, unknown>;
        newValue?: Record<string, unknown>;
        notes?: string;
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action,
        targetType: 'admin',
        targetId: targetAdminId,
        targetName: targetAdminName,
        ...options,
    });
}

// 設定変更のログ記録
export async function logSettingsChange(
    admin: AuthenticatedAdmin,
    settingKey: string,
    oldValue: unknown,
    newValue: unknown,
    options?: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action: 'settings_change',
        targetType: 'settings',
        targetName: settingKey,
        oldValue: { value: oldValue },
        newValue: { value: newValue },
        ...options,
    });
}

// ログイン/ログアウトのログ記録
export async function logAuthAction(
    admin: AuthenticatedAdmin,
    action: 'login' | 'logout',
    options?: {
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    await logAdminAction({
        admin,
        action,
        ...options,
    });
}

// 変更差分を計算するヘルパー
export function calculateDiff<T extends Record<string, unknown>>(
    oldObj: T,
    newObj: Partial<T>
): { old: Partial<T>; new: Partial<T> } {
    const oldDiff: Partial<T> = {};
    const newDiff: Partial<T> = {};

    for (const key of Object.keys(newObj) as (keyof T)[]) {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            oldDiff[key] = oldObj[key];
            newDiff[key] = newObj[key];
        }
    }

    return { old: oldDiff, new: newDiff };
}
