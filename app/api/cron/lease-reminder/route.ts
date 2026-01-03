/**
 * POST /api/cron/lease-reminder - Гэрээний хугацааны сануулга
 * Ажиллах хугацаа: Өдөр бүр 09:00
 * Триггер: Хугацаа дуусахаас 30 хоногийн өмнө гэрээ олох
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendLeaseExpiringNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // Calculate date 30 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Find active leases expiring in 30 days
        const { data: leases, error } = await supabase
            .from('leases')
            .select(`
                id,
                end_date,
                company_id,
                tenant_id,
                unit_id,
                tenants:tenant_id(id, name, email, phone),
                units:unit_id(unit_number, properties:property_id(name)),
                companies:company_id(name, phone, features)
            `)
            .eq('status', 'active')
            .eq('end_date', targetDateStr);

        if (error) {
            console.error('Failed to fetch leases:', error);
            return NextResponse.json(
                { error: 'Failed to fetch leases' },
                { status: 500 }
            );
        }

        let sent = 0;
        let skipped = 0;

        for (const lease of leases || []) {
            const tenant = lease.tenants as unknown as { id: string; name: string; email?: string; phone: string } | null;
            const unit = lease.units as unknown as { unit_number: string; properties: { name: string } } | null;
            const company = lease.companies as unknown as { name: string; phone?: string; features: Record<string, boolean> } | null;

            if (!tenant || !unit || !company) {
                skipped++;
                continue;
            }

            // Check if email notifications are enabled
            if (!company.features?.email_notifications || !tenant.email) {
                skipped++;
                continue;
            }

            // Get notification settings
            const { data: settings } = await supabase
                .from('company_notification_settings')
                .select('email_lease_expiring')
                .eq('company_id', lease.company_id)
                .single();

            if (settings?.email_lease_expiring === false) {
                skipped++;
                continue;
            }

            const result = await sendLeaseExpiringNotification(
                lease.company_id,
                tenant.id,
                {
                    tenantName: tenant.name,
                    propertyName: unit.properties.name,
                    unitNumber: unit.unit_number,
                    endDate: lease.end_date || '',
                    daysLeft: 30,
                    companyName: company.name,
                    companyPhone: company.phone || '',
                }
            );

            if (result.queued > 0) {
                sent++;
            } else {
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: leases?.length || 0,
            sent,
            skipped,
        });
    } catch (error) {
        console.error('Lease reminder cron error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
