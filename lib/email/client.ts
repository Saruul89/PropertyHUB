// EmailJS REST API client (server-side compatible)
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
const privateKey = process.env.NEXT_PUBLIC_EMAILJS_PRIVATE_KEY;
const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;

export type EmailParams = {
  to_email: string;
  to_name: string;
  subject: string;
  message: string;
  [key: string]: string | number | undefined;
};

export async function sendEmail(
  templateId: string,
  params: EmailParams
): Promise<boolean> {
  if (!publicKey || !serviceId || !privateKey) {
    console.error('EmailJS not configured: missing keys');
    return false;
  }

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        accessToken: privateKey,
        template_params: params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('EmailJS error:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Lease expiry notification
export async function sendLeaseExpiryEmail(params: {
  toEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  endDate: string;
  daysRemaining: number;
  companyName: string;
}): Promise<boolean> {
  const templateId = process.env.EMAILJS_LEASE_EXPIRY_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  if (!templateId) {
    console.error('Missing EMAILJS_LEASE_EXPIRY_TEMPLATE_ID');
    return false;
  }
  return sendEmail(templateId, {
    to_email: params.toEmail,
    to_name: params.tenantName,
    subject: `[${params.companyName}] Гэрээний хугацаа дуусах анхааруулга`,
    message: `Таны гэрээний хугацаа ${params.daysRemaining} өдрийн дараа дуусна.`,
    property_name: params.propertyName,
    unit_number: params.unitNumber,
    end_date: params.endDate,
    days_remaining: params.daysRemaining,
    company_name: params.companyName,
  });
}

// Billing reminder
export async function sendBillingReminderEmail(params: {
  toEmail: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  billingMonth: string;
  totalAmount: number;
  dueDate: string;
  daysUntilDue: number;
  companyName: string;
}): Promise<boolean> {
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_BILLING_REMINDER_TEMPLATE_ID || process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  if (!templateId) {
    console.error('Missing EMAILJS_BILLING_REMINDER_TEMPLATE_ID');
    return false;
  }
  const formattedAmount = new Intl.NumberFormat('mn-MN').format(params.totalAmount);

  return sendEmail(templateId, {
    to_email: params.toEmail,
    to_name: params.tenantName,
    subject: `[${params.companyName}] Төлбөрийн сануулга - ${params.billingMonth}`,
    message: `${params.billingMonth} сарын төлбөрийн хугацаа ${params.daysUntilDue} өдрийн дараа дуусна.`,
    property_name: params.propertyName,
    unit_number: params.unitNumber,
    billing_month: params.billingMonth,
    total_amount: formattedAmount,
    due_date: params.dueDate,
    days_until_due: params.daysUntilDue,
    company_name: params.companyName,
  });
}
