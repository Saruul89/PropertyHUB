/**
 * POST /api/cron/overdue-check - Хугацаа хэтрэлтийн шалгалт
 * Ажиллах хугацаа: Өдөр бүр 00:05
 * Триггер: Хугацаа хэтэрсэн нэхэмжлэхийг overdue болгон шинэчлэх
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOverdueNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        const today = new Date().toISOString().split('T')[0];

        // Find billings that are past due and still pending
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
            .lt('due_date', today);

        if (error) {
            console.error('Failed to fetch billings:', error);
            return NextResponse.json(
                { error: 'Failed to fetch billings' },
                { status: 500 }
            );
        }

        let updated = 0;
        let notified = 0;

        for (const billing of billings || []) {
            // Update status to overdue
            const { error: updateError } = await supabase
                .from('billings')
                .update({ status: 'overdue', updated_at: new Date().toISOString() })
                .eq('id', billing.id);

            if (updateError) {
                console.error('Failed to update billing status:', updateError);
                continue;
            }

            updated++;

            const tenant = billing.tenants as unknown as { id: string; name: string; email?: string; phone: string } | null;
            const company = billing.companies as unknown as { name: string; phone?: string; features: Record<string, boolean> } | null;

            if (!tenant || !company) {
                continue;
            }

            // Check if notifications are enabled
            const channels: ('email' | 'sms')[] = [];
            if (company.features?.email_notifications && tenant.email) {
                channels.push('email');
            }
            if (company.features?.sms_notifications && tenant.phone) {
                channels.push('sms');
            }

            if (channels.length === 0) {
                continue;
            }

            // Get notification settings
            const { data: settings } = await supabase
                .from('company_notification_settings')
                .select('email_overdue_notice, sms_overdue_notice')
                .eq('company_id', billing.company_id)
                .single();

            const enabledChannels = channels.filter(ch => {
                if (ch === 'email') return settings?.email_overdue_notice !== false;
                if (ch === 'sms') return settings?.sms_overdue_notice !== false;
                return false;
            });

            if (enabledChannels.length === 0) {
                continue;
            }

            // Calculate days overdue
            const dueDate = new Date(billing.due_date);
            const now = new Date();
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const month = `${dueDate.getFullYear()} оны ${dueDate.getMonth() + 1}-р сар`;

            const result = await sendOverdueNotification(
                billing.company_id,
                tenant.id,
                {
                    tenantName: tenant.name,
                    billingNumber: billing.billing_number || '',
                    totalAmount: billing.total_amount,
                    dueDate: billing.due_date,
                    daysOverdue,
                    companyName: company.name,
                    companyPhone: company.phone || '',
                    month,
                },
                enabledChannels
            );

            if (result.queued > 0) {
                notified++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: billings?.length || 0,
            updated,
            notified,
        });
    } catch (error) {
        console.error('Overdue check cron error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
