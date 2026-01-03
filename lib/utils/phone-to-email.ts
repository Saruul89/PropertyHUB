const TENANT_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_TENANT_EMAIL_DOMAIN || 'tenant.propertyhub.mn';

/**
 * 電話番号を偽装メールアドレスに変換
 * 例: 99001234 → 99001234@tenant.propertyhub.mn
 */
export function phoneToEmail(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    return `${cleanPhone}@${TENANT_EMAIL_DOMAIN}`;
}

/**
 * 偽装メールアドレスから電話番号を抽出
 */
export function emailToPhone(email: string): string {
    return email.split('@')[0];
}

/**
 * 入居者用の偽装メールかどうかをチェック
 */
export function isTenantEmail(email: string): boolean {
    return email.endsWith(`@${TENANT_EMAIL_DOMAIN}`);
}
