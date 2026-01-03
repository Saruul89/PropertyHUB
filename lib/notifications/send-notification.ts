/**
 * Notification Sending Service
 *
 * ⚠️ Анхааруулга:
 * - Илгээхийн өмнө тохиргоог шалгах (email_notifications / sms_notifications)
 * - Async процесс үндсэн ажлыг блоклохгүй
 * - Түрээслэгчийн холбоо барих: Имэйл (заавал биш), SMS (утас заавал)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { queueNotification } from "./queue";
import type { NotificationChannel, NotificationType } from "@/types";

interface SendNotificationParams {
  companyId: string;
  recipientType: "tenant" | "company_user";
  recipientId: string;
  recipientEmail?: string;
  recipientPhone?: string;
  type: "billing" | "reminder" | "maintenance" | "announcement";
  title: string;
  message: string;
  channel: NotificationChannel;
  relatedType?: string;
  relatedId?: string;
}

interface SendNotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

export async function sendNotification(
  params: SendNotificationParams
): Promise<SendNotificationResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      company_id: params.companyId,
      recipient_type: params.recipientType,
      recipient_id: params.recipientId,
      recipient_email: params.recipientEmail,
      recipient_phone: params.recipientPhone,
      type: params.type,
      title: params.title,
      message: params.message,
      channel: params.channel,
      related_type: params.relatedType,
      related_id: params.relatedId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // For in_app notifications, mark as sent immediately
  if (params.channel === "in_app") {
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  // For email/SMS, queue for processing
  if (params.channel === "email" && params.recipientEmail) {
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  if (params.channel === "sms" && params.recipientPhone) {
    await supabase
      .from("notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return { success: true, notificationId: data.id };
}

export async function sendBulkNotifications(
  notifications: SendNotificationParams[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const notification of notifications) {
    const result = await sendNotification(notification);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

export async function sendBillingReminder(
  companyId: string,
  tenantId: string,
  tenantEmail: string | undefined,
  tenantPhone: string,
  billingId: string,
  amount: number,
  dueDate: string
): Promise<SendNotificationResult> {
  const message = `Төлбөрийн мэдэгдэл: ${amount.toLocaleString()}₮ нэхэмжлэл байна. Төлбөрийн хугацаа: ${new Date(
    dueDate
  ).toLocaleDateString("mn-MN")}`;

  return sendNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    recipientEmail: tenantEmail,
    recipientPhone: tenantPhone,
    type: "billing",
    title: "Төлбөрийн мэдэгдэл",
    message,
    channel: "in_app",
    relatedType: "billing",
    relatedId: billingId,
  });
}

export async function sendMaintenanceUpdate(
  companyId: string,
  tenantId: string,
  maintenanceId: string,
  status: string,
  title: string
): Promise<SendNotificationResult> {
  const statusLabels: Record<string, string> = {
    pending: "Хүлээгдэж буй",
    in_progress: "Хийгдэж буй",
    completed: "Дууссан",
    cancelled: "Цуцлагдсан",
  };

  const message = `「${title}」засварын төлөв「${
    statusLabels[status] || status
  }」болж шинэчлэгдлээ.`;

  return sendNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    type: "maintenance",
    title: "Засварын мэдэгдэл",
    message,
    channel: "in_app",
    relatedType: "maintenance",
    relatedId: maintenanceId,
  });
}

/**
 * Queue notification for email/SMS delivery
 * Uses the new notification queue system with templates
 */
interface QueueTypedNotificationParams {
  companyId: string;
  recipientType: "tenant" | "company_user";
  recipientId: string;
  notificationType: NotificationType;
  channels: ("email" | "sms")[];
  templateData: Record<string, unknown>;
}

export async function queueTypedNotification(
  params: QueueTypedNotificationParams
): Promise<{ success: boolean; queued: number; errors: string[] }> {
  const errors: string[] = [];
  let queued = 0;

  for (const channel of params.channels) {
    const result = await queueNotification({
      company_id: params.companyId,
      recipient_type: params.recipientType,
      recipient_id: params.recipientId,
      notification_type: params.notificationType,
      channel,
      template_data: params.templateData,
    });

    if (result.success && !result.skipped) {
      queued++;
    } else if (!result.success && result.error) {
      errors.push(result.error);
    }
  }

  return {
    success: errors.length === 0,
    queued,
    errors,
  };
}

/**
 * Send billing issued notification
 */
export async function sendBillingIssuedNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    month: string;
    billingNumber: string;
    billingMonth: string;
    totalAmount: number;
    dueDate: string;
    portalUrl: string;
    companyName: string;
  }
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "billing_issued",
    channels: ["email"],
    templateData: {
      tenant_name: data.tenantName,
      month: data.month,
      billing_number: data.billingNumber,
      billing_month: data.billingMonth,
      total_amount: data.totalAmount,
      due_date: data.dueDate,
      portal_url: data.portalUrl,
      company_name: data.companyName,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send payment reminder notification
 */
export async function sendPaymentReminderNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    billingNumber: string;
    totalAmount: number;
    dueDate: string;
    daysLeft: number;
    companyName: string;
    month?: string;
    shortUrl?: string;
  },
  channels: ("email" | "sms")[] = ["email"]
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "payment_reminder",
    channels,
    templateData: {
      tenant_name: data.tenantName,
      billing_number: data.billingNumber,
      total_amount: data.totalAmount,
      due_date: data.dueDate,
      days_left: data.daysLeft,
      company_name: data.companyName,
      month: data.month,
      amount: data.totalAmount,
      short_url: data.shortUrl,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send overdue notice notification
 */
export async function sendOverdueNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    billingNumber: string;
    totalAmount: number;
    dueDate: string;
    daysOverdue: number;
    companyName: string;
    companyPhone: string;
    month?: string;
  },
  channels: ("email" | "sms")[] = ["email", "sms"]
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "overdue_notice",
    channels,
    templateData: {
      tenant_name: data.tenantName,
      billing_number: data.billingNumber,
      total_amount: data.totalAmount,
      due_date: data.dueDate,
      days_overdue: data.daysOverdue,
      company_name: data.companyName,
      company_phone: data.companyPhone,
      month: data.month,
      amount: data.totalAmount,
      phone: data.companyPhone,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send payment confirmed notification
 */
export async function sendPaymentConfirmedNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    billingNumber: string;
    paidAmount: number;
    paymentDate: string;
    remainingAmount: number;
    companyName: string;
  }
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "payment_confirmed",
    channels: ["email"],
    templateData: {
      tenant_name: data.tenantName,
      billing_number: data.billingNumber,
      paid_amount: data.paidAmount,
      payment_date: data.paymentDate,
      remaining_amount: data.remainingAmount,
      company_name: data.companyName,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send lease expiring notification
 */
export async function sendLeaseExpiringNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    propertyName: string;
    unitNumber: string;
    endDate: string;
    daysLeft: number;
    companyName: string;
    companyPhone: string;
  }
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "lease_expiring",
    channels: ["email"],
    templateData: {
      tenant_name: data.tenantName,
      property_name: data.propertyName,
      unit_number: data.unitNumber,
      end_date: data.endDate,
      days_left: data.daysLeft,
      company_name: data.companyName,
      company_phone: data.companyPhone,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send maintenance update notification (email version)
 */
export async function sendMaintenanceUpdateNotification(
  companyId: string,
  tenantId: string,
  data: {
    tenantName: string;
    title: string;
    status: string;
    statusLabel: string;
    notes?: string;
    companyName: string;
  }
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "maintenance_update",
    channels: ["email"],
    templateData: {
      tenant_name: data.tenantName,
      title: data.title,
      status: data.status,
      status_label: data.statusLabel,
      notes: data.notes,
      company_name: data.companyName,
    },
  });

  return { success: result.success, queued: result.queued };
}

/**
 * Send account created notification (SMS only)
 */
export async function sendAccountCreatedNotification(
  companyId: string,
  tenantId: string,
  data: {
    phone: string;
    password: string;
    loginUrl: string;
  }
): Promise<{ success: boolean; queued: number }> {
  const result = await queueTypedNotification({
    companyId,
    recipientType: "tenant",
    recipientId: tenantId,
    notificationType: "account_created",
    channels: ["sms"],
    templateData: {
      phone: data.phone,
      password: data.password,
      url: data.loginUrl,
    },
  });

  return { success: result.success, queued: result.queued };
}
