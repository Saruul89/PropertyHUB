// Notification System Type Definitions

export type NotificationType =
    | 'billing_issued'
    | 'payment_reminder'
    | 'overdue_notice'
    | 'payment_confirmed'
    | 'lease_expiring'
    | 'maintenance_update'
    | 'account_created';

export type NotificationQueueStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface NotificationQueueItem {
    id: string;
    company_id: string;
    recipient_type: 'tenant' | 'company_user';
    recipient_id: string;
    notification_type: NotificationType;
    channel: 'email' | 'sms';
    template_data: Record<string, unknown>;
    status: NotificationQueueStatus;
    attempts: number;
    last_error?: string;
    scheduled_at: string;
    sent_at?: string;
    created_at: string;
}

export interface NotificationSettings {
    id: string;
    company_id: string;
    // Email settings
    email_billing_issued: boolean;
    email_payment_reminder: boolean;
    email_overdue_notice: boolean;
    email_payment_confirmed: boolean;
    email_lease_expiring: boolean;
    // SMS settings
    sms_payment_reminder: boolean;
    sms_overdue_notice: boolean;
    sms_account_created: boolean;
    // Sender settings
    sender_email?: string;
    sender_name?: string;
    updated_at: string;
}

export interface NotificationSettingsInput {
    email_billing_issued?: boolean;
    email_payment_reminder?: boolean;
    email_overdue_notice?: boolean;
    email_payment_confirmed?: boolean;
    email_lease_expiring?: boolean;
    sms_payment_reminder?: boolean;
    sms_overdue_notice?: boolean;
    sms_account_created?: boolean;
    sender_email?: string;
    sender_name?: string;
}

export interface SendNotificationInput {
    type: NotificationType;
    channels: ('email' | 'sms')[];
    recipient_ids: string[];
    template_data?: Record<string, unknown>;
}

export interface QueueNotificationInput {
    company_id: string;
    recipient_type: 'tenant' | 'company_user';
    recipient_id: string;
    notification_type: NotificationType;
    channel: 'email' | 'sms';
    template_data: Record<string, unknown>;
    scheduled_at?: string;
}

// Email template data interfaces
export interface BillingIssuedData {
    tenant_name: string;
    month: string;
    billing_number: string;
    billing_month: string;
    total_amount: number;
    due_date: string;
    portal_url: string;
    company_name: string;
}

export interface PaymentReminderData {
    tenant_name: string;
    billing_number: string;
    total_amount: number;
    due_date: string;
    days_left: number;
    company_name: string;
}

export interface OverdueNoticeData {
    tenant_name: string;
    billing_number: string;
    total_amount: number;
    due_date: string;
    days_overdue: number;
    company_name: string;
    company_phone: string;
}

export interface PaymentConfirmedData {
    tenant_name: string;
    billing_number: string;
    paid_amount: number;
    payment_date: string;
    remaining_amount: number;
    company_name: string;
}

export interface LeaseExpiringData {
    tenant_name: string;
    property_name: string;
    unit_number: string;
    end_date: string;
    days_left: number;
    company_name: string;
    company_phone: string;
}

export interface MaintenanceUpdateData {
    tenant_name: string;
    title: string;
    status: string;
    status_label: string;
    notes?: string;
    company_name: string;
}

export interface AccountCreatedData {
    phone: string;
    password: string;
    login_url: string;
}

// SMS template data interfaces (shorter versions)
export interface SmsPaymentReminderData {
    month: string;
    amount: number;
    due_date: string;
    short_url: string;
}

export interface SmsOverdueNoticeData {
    month: string;
    amount: number;
    phone: string;
}

export interface SmsAccountCreatedData {
    phone: string;
    password: string;
    url: string;
}
