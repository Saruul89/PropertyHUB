import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeaseExpiryEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) return false;
  return authHeader === `Bearer ${cronSecret}`;
}

// GET /api/cron/lease-expiry-notifications
// Send notifications for leases expiring in 30, 14, and 7 days
export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  const notificationDays = [30, 14, 7];

  let totalSent = 0;
  const errors: string[] = [];

  for (const days of notificationDays) {
    const targetDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    const { data: leases, error } = await supabase
      .from('leases')
      .select(`
        id,
        end_date,
        tenant:tenants(id, name, email, phone),
        unit:units(unit_number, property:properties(name)),
        company:companies(id, name, features)
      `)
      .eq('status', 'active')
      .eq('end_date', targetDateStr);

    if (error) {
      errors.push(`Error fetching leases for ${days} days: ${error.message}`);
      continue;
    }

    if (!leases || leases.length === 0) continue;

    for (const lease of leases) {
      const tenant = Array.isArray(lease.tenant) ? lease.tenant[0] : lease.tenant;
      const unit = Array.isArray(lease.unit) ? lease.unit[0] : lease.unit;
      const company = Array.isArray(lease.company) ? lease.company[0] : lease.company;
      const property = unit?.property ? (Array.isArray(unit.property) ? unit.property[0] : unit.property) : null;

      const features = company?.features as Record<string, boolean> | null;
      if (!features?.email_notifications) continue;

      const tenantEmail = tenant?.email;
      if (!tenantEmail) continue;

      const success = await sendLeaseExpiryEmail({
        toEmail: tenantEmail,
        tenantName: tenant?.name || 'Түрээслэгч',
        propertyName: property?.name || '-',
        unitNumber: unit?.unit_number || '-',
        endDate: new Date(lease.end_date).toLocaleDateString('mn-MN'),
        daysRemaining: days,
        companyName: company?.name || 'PropertyHub',
      });

      if (success) {
        totalSent++;

        await supabase.from('notifications').insert({
          company_id: company?.id,
          tenant_id: tenant?.id,
          type: 'lease_expiry',
          title: `Гэрээний хугацаа ${days} өдрийн дараа дуусна`,
          message: `${property?.name} - ${unit?.unit_number}`,
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
