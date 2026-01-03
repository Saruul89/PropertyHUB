/**
 * POST /api/cron/payment-reminder - Төлбөрийн хугацааны сануулга
 * Ажиллах хугацаа: Өдөр бүр 09:00
 * Триггер: Хугацаа дуусахаас 3 хоногийн өмнө нэхэмжлэх олох
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentReminderNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // Calculate date 3 days from now
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 3);
        const targetDateStr = targetDate.toISOString().split('T')[0];

        // Find billings with due date 3 days from now that are still pending
        const { data: billings, error } = await supabase
            .from('billings')
            .select(`
                id,
                billing_number,
                total_amount,
                due_date,
                company_id,
                tenant_id,
                tenants:tenant_id(id, name, email, phone),
                companies:company_id(name, phone, features)
            `)
            .eq('status', 'pending')
            .eq('due_date', targetDateStr);

        if (error) {
            console.error('Failed to fetch billings:', error);
            return NextResponse.json(
                { error: 'Failed to fetch billings' },
                { status: 500 }
            );
        }

        let sent = 0;
        let skipped = 0;

        for (const billing of billings || []) {
            const tenant = billing.tenants as unknown as { id: string; name: string; email?: string; phone: string } | null;
            const company = billing.companies as unknown as { name: string; phone?: string; features: Record<string, boolean> } | null;

            if (!tenant || !company) {
                skipped++;
                continue;
            }

            // Check if email notifications are enabled
            const channels: ('email' | 'sms')[] = [];
            if (company.features?.email_notifications && tenant.email) {
                channels.push('email');
            }
            if (company.features?.sms_notifications && tenant.phone) {
                channels.push('sms');
            }

            if (channels.length === 0) {
                skipped++;
                continue;
            }

            // Get notification settings to check if payment reminder is enabled
            const { data: settings } = await supabase
                .from('company_notification_settings')
                .select('email_payment_reminder, sms_payment_reminder')
                .eq('company_id', billing.company_id)
                .single();

            const enabledChannels = channels.filter(ch => {
                if (ch === 'email') return settings?.email_payment_reminder !== false;
                if (ch === 'sms') return settings?.sms_payment_reminder === true;
                return false;
            });

            if (enabledChannels.length === 0) {
                skipped++;
                continue;
            }

            const dueDate = new Date(billing.due_date);
            const month = `${dueDate.getFullYear()} оны ${dueDate.getMonth() + 1}-р сар`;

            const result = await sendPaymentReminderNotification(
                billing.company_id,
                tenant.id,
                {
                    tenantName: tenant.name,
                    billingNumber: billing.billing_number || '',
                    totalAmount: billing.total_amount,
                    dueDate: billing.due_date,
                    daysLeft: 3,
                    companyName: company.name,
                    month,
                    shortUrl: `${process.env.NEXT_PUBLIC_APP_URL}/tenant/billings`,
                },
                enabledChannels
            );

            if (result.queued > 0) {
                sent++;
            } else {
                skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: billings?.length || 0,
            sent,
            skipped,
        });
    } catch (error) {
        console.error('Payment reminder cron error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
