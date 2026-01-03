// lib/i18n/notification-templates.ts
// Notification templates in Mongolian for PropertyHub

export interface TemplateParams {
  [key: string]: string | number;
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, params: TemplateParams): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

// ============================================
// Email Templates
// ============================================

export const emailTemplates = {
  /**
   * Billing issued notification
   */
  billingIssued: {
    subject: '【PropertyHub】{month} сарын нэхэмжлэх',
    body: `
{tenant_name} танд,

{month} сарын нэхэмжлэх үүслээ.

━━━━━━━━━━━━━━━━━━━━
Нэхэмжлэхийн дугаар: {billing_number}
Тооцооны сар: {billing_month}
Нийт дүн: {total_amount}
Төлөх хугацаа: {due_date}
━━━━━━━━━━━━━━━━━━━━

Дэлгэрэнгүй мэдээллийг порталаас харна уу:
{portal_url}

--
{company_name}
    `.trim(),
  },

  /**
   * Payment reminder
   */
  paymentReminder: {
    subject: '【PropertyHub】Төлбөрийн сануулга',
    body: `
{tenant_name} танд,

{billing_month} сарын төлбөрийн хугацаа {due_date}-нд дуусна.

━━━━━━━━━━━━━━━━━━━━
Нэхэмжлэхийн дугаар: {billing_number}
Нийт дүн: {total_amount}
Үлдэгдэл: {remaining_amount}
━━━━━━━━━━━━━━━━━━━━

Төлбөрөө цаг хугацаанд нь төлнө үү.

Порталд нэвтрэх:
{portal_url}

--
{company_name}
    `.trim(),
  },

  /**
   * Overdue notice
   */
  overdueNotice: {
    subject: '【Яаралтай】Төлбөр хугацаа хэтэрсэн',
    body: `
{tenant_name} танд,

Дараах нэхэмжлэх төлөгдөөгүй байна. Яаралтай төлнө үү.

Нэхэмжлэхийн дугаар: {billing_number}
Нийт дүн: {total_amount}
Төлөх хугацаа: {due_date} ({days_overdue} өдөр хэтэрсэн)

Асуулт байвал холбогдоно уу.

--
{company_name}
Утас: {company_phone}
    `.trim(),
  },

  /**
   * Payment confirmed
   */
  paymentConfirmed: {
    subject: '【PropertyHub】Төлбөр баталгаажсан',
    body: `
{tenant_name} танд,

Төлбөр амжилттай бүртгэгдлээ. Баярлалаа!

━━━━━━━━━━━━━━━━━━━━
Нэхэмжлэхийн дугаар: {billing_number}
Төлсөн дүн: {paid_amount}
Төлсөн огноо: {payment_date}
Үлдэгдэл: {remaining_amount}
━━━━━━━━━━━━━━━━━━━━

--
{company_name}
    `.trim(),
  },

  /**
   * Lease expiring notification
   */
  leaseExpiring: {
    subject: '【PropertyHub】Гэрээ дуусах мэдэгдэл',
    body: `
{tenant_name} танд,

Таны гэрээ удахгүй дуусна.

━━━━━━━━━━━━━━━━━━━━
Гэрээний дугаар: {lease_number}
Өрөө: {unit_number}
Дуусах огноо: {end_date}
Үлдсэн өдөр: {days_remaining} өдөр
━━━━━━━━━━━━━━━━━━━━

Гэрээ сунгах талаар холбогдоно уу.

--
{company_name}
Утас: {company_phone}
    `.trim(),
  },

  /**
   * Maintenance update
   */
  maintenanceUpdate: {
    subject: '【PropertyHub】Засварын мэдэгдэл',
    body: `
{tenant_name} танд,

Таны засварын хүсэлтийн төлөв шинэчлэгдлээ.

━━━━━━━━━━━━━━━━━━━━
Хүсэлтийн дугаар: {request_number}
Гарчиг: {request_title}
Шинэ төлөв: {new_status}
━━━━━━━━━━━━━━━━━━━━

{status_message}

--
{company_name}
    `.trim(),
  },

  /**
   * Account created
   */
  accountCreated: {
    subject: '【PropertyHub】Бүртгэл үүссэн',
    body: `
{tenant_name} танд,

PropertyHub системд таны бүртгэл амжилттай үүслээ.

━━━━━━━━━━━━━━━━━━━━
Нэвтрэх нэр: {login_phone}
Анхны нууц үг: {initial_password}
━━━━━━━━━━━━━━━━━━━━

⚠️ Анхаарна уу: Анхны нэвтрэлтийн дараа нууц үгээ заавал солино уу.

Портал руу нэвтрэх:
{portal_url}

--
{company_name}
    `.trim(),
  },

  /**
   * Password reset
   */
  passwordReset: {
    subject: '【PropertyHub】Нууц үг шинэчлэгдсэн',
    body: `
{tenant_name} танд,

Таны нууц үг шинэчлэгдлээ.

━━━━━━━━━━━━━━━━━━━━
Шинэ нууц үг: {new_password}
━━━━━━━━━━━━━━━━━━━━

⚠️ Анхаарна уу: Нэвтэрсний дараа нууц үгээ заавал солино уу.

--
{company_name}
    `.trim(),
  },
};

// ============================================
// SMS Templates (Max 70 characters recommended)
// ============================================

export const smsTemplates = {
  /**
   * Payment reminder SMS
   */
  paymentReminder: '【PropertyHub】{month} сарын ₮{amount} төлбөр {due_date}-нд дуусна.',

  /**
   * Overdue notice SMS
   */
  overdueNotice: '【Яаралтай】₮{amount} төлбөр хугацаа хэтэрсэн. Утас:{phone}',

  /**
   * Account created SMS
   */
  accountCreated: '【PropertyHub】Бүртгэл: {phone}, Нууц үг: {password}',

  /**
   * Payment confirmed SMS
   */
  paymentConfirmed: '【PropertyHub】₮{amount} төлбөр баталгаажлаа. Баярлалаа!',

  /**
   * Lease expiring SMS
   */
  leaseExpiring: '【PropertyHub】Гэрээ {days} өдрийн дараа дуусна. Холбогдоно уу.',

  /**
   * Meter reading reminder SMS
   */
  meterReadingReminder: '【PropertyHub】Тоолуурын заалтаа {due_date} хүртэл илгээнэ үү.',
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get formatted email content
 */
export function getEmailContent(
  templateName: keyof typeof emailTemplates,
  params: TemplateParams
): { subject: string; body: string } {
  const template = emailTemplates[templateName];
  return {
    subject: replaceVariables(template.subject, params),
    body: replaceVariables(template.body, params),
  };
}

/**
 * Get formatted SMS content
 */
export function getSmsContent(templateName: keyof typeof smsTemplates, params: TemplateParams): string {
  const template = smsTemplates[templateName];
  return replaceVariables(template, params);
}

// ============================================
// Maintenance Status Messages
// ============================================

export const maintenanceStatusMessages = {
  pending: 'Таны хүсэлт хүлээн авлаа. Удахгүй шалгаж холбогдоно.',
  inProgress: 'Засварын ажил эхэллээ.',
  completed: 'Засварын ажил дууслаа.',
  cancelled: 'Засварын хүсэлт цуцлагдлаа.',
};
