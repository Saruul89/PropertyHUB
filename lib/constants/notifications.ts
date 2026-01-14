import type { Notification } from "@/types";

// Notification Type
export type NotificationType = Notification["type"];

export const NOTIFICATION_TYPE = {
  BILLING: "billing",
  REMINDER: "reminder",
  MAINTENANCE: "maintenance",
  ANNOUNCEMENT: "announcement",
} as const;

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  billing: "Төлбөр",
  reminder: "Сануулга",
  maintenance: "Засвар",
  announcement: "Мэдэгдэл",
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  billing: "bg-blue-100 text-blue-800",
  reminder: "bg-orange-100 text-orange-800",
  maintenance: "bg-purple-100 text-purple-800",
  announcement: "bg-gray-100 text-gray-800",
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  billing: "receipt",
  reminder: "bell-ring",
  maintenance: "wrench",
  announcement: "megaphone",
};

// Notification Status
export type NotificationStatusType = Notification["status"];

export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  READ: "read",
} as const;

export const NOTIFICATION_STATUS_LABELS: Record<NotificationStatusType, string> = {
  pending: "Хүлээгдэж буй",
  sent: "Илгээсэн",
  failed: "Алдаатай",
  read: "Уншсан",
};

export const NOTIFICATION_STATUS_COLORS: Record<NotificationStatusType, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  read: "bg-green-100 text-green-800",
};

// Notification Channel
export type NotificationChannelType = Notification["channel"];

export const NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  SMS: "sms",
  IN_APP: "in_app",
} as const;

export const NOTIFICATION_CHANNEL_LABELS: Record<NotificationChannelType, string> = {
  email: "Имэйл",
  sms: "SMS",
  in_app: "Апп дотор",
};

// Recipient Type
export type NotificationRecipientType = Notification["recipient_type"];

export const NOTIFICATION_RECIPIENT_TYPE = {
  TENANT: "tenant",
  COMPANY_USER: "company_user",
} as const;

export const NOTIFICATION_RECIPIENT_TYPE_LABELS: Record<NotificationRecipientType, string> = {
  tenant: "Түрээслэгч",
  company_user: "Ажилтан",
};

// Helper function to get all notification types as array
export const getNotificationTypes = (): NotificationType[] =>
  Object.values(NOTIFICATION_TYPE) as NotificationType[];

// Helper function to get all notification statuses as array
export const getNotificationStatuses = (): NotificationStatusType[] =>
  Object.values(NOTIFICATION_STATUS) as NotificationStatusType[];

// Helper function to get all notification channels as array
export const getNotificationChannels = (): NotificationChannelType[] =>
  Object.values(NOTIFICATION_CHANNEL) as NotificationChannelType[];

// Related type to navigation path mapping
export const NOTIFICATION_RELATED_TYPE_PATHS: Record<string, string> = {
  meter_submission: "/dashboard/meter-readings/submissions",
  billing: "/dashboard/billings",
  payment_claim: "/dashboard/billings",
  maintenance: "/dashboard/maintenance",
  lease: "/dashboard/leases",
  tenant: "/dashboard/tenants",
  property: "/dashboard/properties",
};

// Get navigation path for a notification
export const getNotificationPath = (
  relatedType?: string | null,
  relatedId?: string | null
): string | null => {
  if (!relatedType) return null;

  const basePath = NOTIFICATION_RELATED_TYPE_PATHS[relatedType];
  if (!basePath) return null;

  // For some types, we navigate to the detail page if we have an ID
  if (relatedId && ["billing", "payment_claim", "maintenance", "lease", "tenant", "property"].includes(relatedType)) {
    return `${basePath}/${relatedId}`;
  }

  return basePath;
};
