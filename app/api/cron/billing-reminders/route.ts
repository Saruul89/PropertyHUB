import { createAdminClient } from '@/lib/supabase/admin';
import { sendBillingReminderEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/billing-reminders
// Send reminders for unpaid billings 7 and 3 days before due date
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const reminderDays = [7, 3];

  let totalSent = 0;
  const errors: string[] = [];

  for (const days of reminderDays) {
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: billings, error } = await supabase
      .from('billings')
      .select(`
        id,
        billing_month,
        total_amount,
        due_date,
        tenant:tenants(id, name, email, phone),
        unit:units(unit_number, property:properties(name)),
        company:companies(id, name, features)
      `)
      .eq('status', 'pending')
      .eq('due_date', targetDateStr);

    if (error) {
      errors.push(`Error fetching billings for ${days} days: ${error.message}`);
      continue;
    }

    if (!billings || billings.length === 0) continue;

    for (const billing of billings) {
      const tenant = Array.isArray(billing.tenant) ? billing.tenant[0] : billing.tenant;
      const unit = Array.isArray(billing.unit) ? billing.unit[0] : billing.unit;
      const company = Array.isArray(billing.company) ? billing.company[0] : billing.company;
      const property = unit?.property ? (Array.isArray(unit.property) ? unit.property[0] : unit.property) : null;

      const features = company?.features as Record<string, boolean> | null;
      if (!features?.email_notifications) continue;

      const tenantEmail = tenant?.email;
      if (!tenantEmail) continue;

      const billingDate = new Date(billing.billing_month + '-01');
      const billingMonthFormatted = billingDate.toLocaleDateString('mn-MN', {
        year: 'numeric',
        month: 'long',
      });

      const success = await sendBillingReminderEmail({
        toEmail: tenantEmail,
        tenantName: tenant?.name || 'Түрээслэгч',
        propertyName: property?.name || '-',
        unitNumber: unit?.unit_number || '-',
        billingMonth: billingMonthFormatted,
        totalAmount: billing.total_amount,
        dueDate: new Date(billing.due_date).toLocaleDateString('mn-MN'),
        daysUntilDue: days,
        companyName: company?.name || 'PropertyHub',
      });

      if (success) {
        totalSent++;

        await supabase.from('notifications').insert({
          company_id: company?.id,
          tenant_id: tenant?.id,
          type: 'billing_reminder',
          title: `Төлбөрийн хугацаа ${days} өдрийн дараа дуусна`,
          message: `${billingMonthFormatted} - ${new Intl.NumberFormat('mn-MN').format(billing.total_amount)}₮`,
          channels: ['email'],
          status: 'sent',
          sent_at: new Date().toISOString(),
        });
      } else {
        errors.push(`Failed to send email to ${tenantEmail}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent: totalSent,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
