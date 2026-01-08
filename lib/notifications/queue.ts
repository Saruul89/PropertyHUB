/**
 * Notification Queue Management
 *
 * ⚠️ Анхааруулга:
 * - Мэдэгдэл илгээх нь background ажилд ажиллана
 * - Үндсэн процессыг блоклохгүй
 * - Илгээхэд алдаа гарвал дахин оролдох (хамгийн ихдээ 3 удаа)
 * - Нэг хэрэглэгчид нэг төрлийн мэдэгдэл өдөрт 1 удаа
 * - Хугацаа хэтэрсэн сануулга долоо хоногт 1 удаа
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from './email';
import { sendSms } from './sms';
import {
    billingIssuedEmail,
    paymentReminderEmail,
    paymentReminderSms,
    overdueNoticeEmail,
    overdueNoticeSms,
    paymentConfirmedEmail,
    leaseExpiringEmail,
    maintenanceUpdateEmail,
    accountCreatedSms,
} from './templates';
import type {
    NotificationType,
    QueueNotificationInput,
    NotificationQueueStatus,
    BillingIssuedData,
    PaymentReminderData,
    SmsPaymentReminderData,
    OverdueNoticeData,
    SmsOverdueNoticeData,
    PaymentConfirmedData,
    LeaseExpiringData,
    MaintenanceUpdateData,
    SmsAccountCreatedData,
} from '@/types';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MINUTES = 15;

/**
 * Format billing month (YYYY-MM) to display format (YYYY оны MM сар)
 */
function formatMonth(billingMonth: string): string {
    if (!billingMonth) return '';
    const [year, month] = billingMonth.split('-');
    return `${year} оны ${parseInt(month)} сар`;
}

interface QueueResult {
    success: boolean;
    queueId?: string;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
}

/**
 * Add notification to queue
 */
export async function queueNotification(input: QueueNotificationInput): Promise<QueueResult> {
    const supabase = createAdminClient();

    console.log('[Queue] queueNotification called:', {
        recipient_id: input.recipient_id,
        notification_type: input.notification_type,
        channel: input.channel,
        skip_duplicate_check: input.skip_duplicate_check
    });

    // Check for duplicate notifications (rate limiting)
    // Skip duplicate check if explicitly requested (開発用)
    if (!input.skip_duplicate_check) {
        const duplicateCheck = await checkDuplicateNotification(
            input.company_id,
            input.recipient_id,
            input.notification_type,
            input.channel
        );

        if (duplicateCheck.isDuplicate) {
            console.log('[Queue] Skipped - duplicate:', duplicateCheck.reason);
            return {
                success: true,
                skipped: true,
                skipReason: duplicateCheck.reason
            };
        }
    } else {
        console.log('[Queue] Duplicate check skipped (開発モード)');
    }

    // Check if recipient has valid contact info
    const contactCheck = await checkRecipientContact(
        input.recipient_type,
        input.recipient_id,
        input.channel
    );

    if (!contactCheck.valid) {
        console.log('[Queue] Skipped - contact check failed:', contactCheck.reason);
        return {
            success: true,
            skipped: true,
            skipReason: contactCheck.reason
        };
    }

    const { data, error } = await supabase
        .from('notifications_queue')
        .insert({
            company_id: input.company_id,
            recipient_type: input.recipient_type,
            recipient_id: input.recipient_id,
            notification_type: input.notification_type,
            channel: input.channel,
            template_data: input.template_data,
            scheduled_at: input.scheduled_at || new Date().toISOString(),
            status: 'pending',
            attempts: 0,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to queue notification:', error);
        return { success: false, error: error.message };
    }

    return { success: true, queueId: data.id };
}

/**
 * Process pending notifications in queue
 */
export async function processNotificationQueue(limit: number = 50): Promise<{
    processed: number;
    sent: number;
    failed: number;
    skipped: number;
}> {
    const supabase = createAdminClient();

    // Get pending notifications that are scheduled to send
    const { data: pendingNotifications, error } = await supabase
        .from('notifications_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .lt('attempts', MAX_RETRY_ATTEMPTS)
        .order('scheduled_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Failed to fetch pending notifications:', error);
        return { processed: 0, sent: 0, failed: 0, skipped: 0 };
    }

    console.log(`[Queue] Found ${pendingNotifications?.length || 0} pending notifications`);

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const notification of pendingNotifications || []) {
        // Fetch tenant data separately
        const { data: tenant } = await supabase
            .from('tenants')
            .select('id, name, email, phone')
            .eq('id', notification.recipient_id)
            .single();

        // Fetch company data separately
        const { data: company } = await supabase
            .from('companies')
            .select('name, phone')
            .eq('id', notification.company_id)
            .single();

        const notificationWithData = {
            ...notification,
            tenants: tenant,
            companies: company,
        };

        const result = await processNotification(notificationWithData);

        if (result.status === 'sent') {
            sent++;
        } else if (result.status === 'failed') {
            failed++;
        } else if (result.status === 'skipped') {
            skipped++;
        }
    }

    return {
        processed: pendingNotifications?.length || 0,
        sent,
        failed,
        skipped
    };
}

/**
 * Process a single notification
 */
async function processNotification(notification: {
    id: string;
    company_id: string;
    recipient_type: string;
    recipient_id: string;
    notification_type: NotificationType;
    channel: 'email' | 'sms';
    template_data: Record<string, unknown>;
    attempts: number;
    tenants?: { id: string; name: string; email?: string; phone: string } | null;
    companies?: { name: string; phone?: string } | null;
}): Promise<{ status: NotificationQueueStatus; error?: string }> {
    const supabase = createAdminClient();

    // Check feature flags
    const flagCheck = await checkFeatureFlag(notification.company_id, notification.channel);
    if (!flagCheck.enabled) {
        await updateNotificationStatus(notification.id, 'skipped', 'Feature flag disabled');
        return { status: 'skipped' };
    }

    // Get recipient contact info
    const tenant = notification.tenants;
    if (!tenant) {
        await updateNotificationStatus(notification.id, 'skipped', 'Recipient not found');
        return { status: 'skipped' };
    }

    let sendResult: { success: boolean; error?: string };

    // Enrich template data with tenant and company info
    let enrichedTemplateData: Record<string, unknown> = {
        ...notification.template_data,
        tenant_name: tenant.name,
        company_name: notification.companies?.name || '',
        company_phone: notification.companies?.phone || '',
        portal_url: process.env.NEXT_PUBLIC_APP_URL || 'https://propertyhub.mn',
    };

    // For billing_issued, fetch the latest billing data for this tenant
    if (notification.notification_type === 'billing_issued') {
        const billingMonth = notification.template_data.billing_month as string;
        const { data: billing } = await supabase
            .from('billings')
            .select('billing_number, total_amount')
            .eq('tenant_id', notification.recipient_id)
            .eq('billing_month', `${billingMonth}-01`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        console.log('[Queue] Fetched billing data:', billing);

        enrichedTemplateData = {
            ...enrichedTemplateData,
            month: billingMonth ? formatMonth(billingMonth) : '',
            billing_month: billingMonth,
            total_amount: billing?.total_amount || 0,
            billing_number: billing?.billing_number || 'N/A',
        };
    }

    console.log('[Queue] Enriched template data:', enrichedTemplateData);

    if (notification.channel === 'email') {
        if (!tenant.email) {
            await updateNotificationStatus(notification.id, 'skipped', 'No email address');
            return { status: 'skipped' };
        }

        const emailContent = generateEmailContent(
            notification.notification_type,
            enrichedTemplateData
        );

        if (!emailContent) {
            await updateNotificationStatus(notification.id, 'failed', 'Unknown notification type');
            return { status: 'failed', error: 'Unknown notification type' };
        }

        sendResult = await sendEmail({
            to: tenant.email,
            subject: emailContent.subject,
            text: emailContent.body.text,
            html: emailContent.body.html,
        });
    } else {
        // SMS
        const smsContent = generateSmsContent(
            notification.notification_type,
            notification.template_data as Record<string, unknown>
        );

        if (!smsContent) {
            await updateNotificationStatus(notification.id, 'failed', 'Unknown notification type');
            return { status: 'failed', error: 'Unknown notification type' };
        }

        sendResult = await sendSms({
            to: tenant.phone,
            message: smsContent.message,
        });
    }

    if (sendResult.success) {
        await supabase
            .from('notifications_queue')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

        return { status: 'sent' };
    } else {
        // Increment attempts and schedule retry if not max attempts
        const newAttempts = notification.attempts + 1;

        if (newAttempts >= MAX_RETRY_ATTEMPTS) {
            await updateNotificationStatus(notification.id, 'failed', sendResult.error);
            return { status: 'failed', error: sendResult.error };
        }

        // Schedule retry
        const retryAt = new Date();
        retryAt.setMinutes(retryAt.getMinutes() + RETRY_DELAY_MINUTES);

        await supabase
            .from('notifications_queue')
            .update({
                attempts: newAttempts,
                last_error: sendResult.error,
                scheduled_at: retryAt.toISOString(),
            })
            .eq('id', notification.id);

        return { status: 'pending' as NotificationQueueStatus };
    }
}

/**
 * Update notification status
 */
async function updateNotificationStatus(
    id: string,
    status: NotificationQueueStatus,
    error?: string
): Promise<void> {
    const supabase = createAdminClient();

    await supabase
        .from('notifications_queue')
        .update({
            status,
            last_error: error,
            ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}),
        })
        .eq('id', id);
}

/**
 * Check for duplicate notifications (rate limiting)
 */
async function checkDuplicateNotification(
    companyId: string,
    recipientId: string,
    type: NotificationType,
    channel: string
): Promise<{ isDuplicate: boolean; reason?: string }> {
    const supabase = createAdminClient();

    // Determine rate limit period based on notification type
    let hoursAgo = 24; // Default: 24 hours
    if (type === 'overdue_notice') {
        hoursAgo = 168; // 7 days for overdue notices
    }

    const checkTime = new Date();
    checkTime.setHours(checkTime.getHours() - hoursAgo);

    const { data } = await supabase
        .from('notifications_queue')
        .select('id')
        .eq('company_id', companyId)
        .eq('recipient_id', recipientId)
        .eq('notification_type', type)
        .eq('channel', channel)
        .in('status', ['sent', 'pending'])
        .gte('created_at', checkTime.toISOString())
        .limit(1);

    if (data && data.length > 0) {
        return {
            isDuplicate: true,
            reason: `Duplicate notification within ${hoursAgo} hours`
        };
    }

    return { isDuplicate: false };
}

/**
 * Check if recipient has valid contact info for the channel
 */
async function checkRecipientContact(
    recipientType: string,
    recipientId: string,
    channel: string
): Promise<{ valid: boolean; reason?: string }> {
    const supabase = createAdminClient();

    console.log('[Queue] checkRecipientContact:', { recipientType, recipientId, channel });

    if (recipientType === 'tenant') {
        const { data: tenant, error } = await supabase
            .from('tenants')
            .select('id, name, email, phone')
            .eq('id', recipientId)
            .single();

        console.log('[Queue] Tenant data:', tenant, 'Error:', error);

        if (!tenant) {
            return { valid: false, reason: 'Tenant not found' };
        }

        if (channel === 'email' && !tenant.email) {
            console.log('[Queue] Tenant has no email:', tenant.name);
            return { valid: false, reason: 'No email address' };
        }

        if (channel === 'sms' && !tenant.phone) {
            return { valid: false, reason: 'No phone number' };
        }
    }

    return { valid: true };
}

/**
 * Check if notification feature is enabled for company
 */
async function checkFeatureFlag(
    companyId: string,
    channel: string
): Promise<{ enabled: boolean }> {
    const supabase = createAdminClient();

    const { data: company } = await supabase
        .from('companies')
        .select('features')
        .eq('id', companyId)
        .single();

    if (!company?.features) {
        return { enabled: false };
    }

    const features = company.features as Record<string, boolean>;

    if (channel === 'email') {
        return { enabled: features.email_notifications === true };
    }

    if (channel === 'sms') {
        return { enabled: features.sms_notifications === true };
    }

    return { enabled: false };
}

/**
 * Generate email content based on notification type
 */
function generateEmailContent(
    type: NotificationType,
    data: Record<string, unknown>
): { subject: string; body: { text: string; html: string } } | null {
    switch (type) {
        case 'billing_issued':
            return billingIssuedEmail(data as unknown as BillingIssuedData);
        case 'payment_reminder':
            return paymentReminderEmail(data as unknown as PaymentReminderData);
        case 'overdue_notice':
            return overdueNoticeEmail(data as unknown as OverdueNoticeData);
        case 'payment_confirmed':
            return paymentConfirmedEmail(data as unknown as PaymentConfirmedData);
        case 'lease_expiring':
            return leaseExpiringEmail(data as unknown as LeaseExpiringData);
        case 'maintenance_update':
            return maintenanceUpdateEmail(data as unknown as MaintenanceUpdateData);
        default:
            return null;
    }
}

/**
 * Generate SMS content based on notification type
 */
function generateSmsContent(
    type: NotificationType,
    data: Record<string, unknown>
): { message: string } | null {
    switch (type) {
        case 'payment_reminder':
            return paymentReminderSms(data as unknown as SmsPaymentReminderData);
        case 'overdue_notice':
            return overdueNoticeSms(data as unknown as SmsOverdueNoticeData);
        case 'account_created':
            return accountCreatedSms(data as unknown as SmsAccountCreatedData);
        default:
            return null;
    }
}

/**
 * Retry failed notifications
 */
export async function retryFailedNotifications(): Promise<number> {
    const supabase = createAdminClient();

    // Get failed notifications that haven't exceeded max attempts
    const { data: failedNotifications, error } = await supabase
        .from('notifications_queue')
        .select('id')
        .eq('status', 'failed')
        .lt('attempts', MAX_RETRY_ATTEMPTS);

    if (error || !failedNotifications) {
        return 0;
    }

    // Reset status to pending for retry
    const retryAt = new Date();
    retryAt.setMinutes(retryAt.getMinutes() + RETRY_DELAY_MINUTES);

    const { count } = await supabase
        .from('notifications_queue')
        .update({
            status: 'pending',
            scheduled_at: retryAt.toISOString(),
        })
        .eq('status', 'failed')
        .lt('attempts', MAX_RETRY_ATTEMPTS);

    return count || 0;
}
