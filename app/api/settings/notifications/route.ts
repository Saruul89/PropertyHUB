/**
 * GET/PUT /api/settings/notifications - Мэдэгдлийн тохиргоо авах, шинэчлэх
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NotificationSettingsInput } from '@/types';

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get company_id
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Get notification settings
        const { data: settings, error } = await supabase
            .from('company_notification_settings')
            .select('*')
            .eq('company_id', companyUser.company_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Failed to fetch notification settings:', error);
            return NextResponse.json(
                { error: 'Failed to fetch notification settings' },
                { status: 500 }
            );
        }

        // Return default settings if none exist
        if (!settings) {
            return NextResponse.json({
                email_billing_issued: true,
                email_payment_reminder: true,
                email_overdue_notice: true,
                email_payment_confirmed: true,
                email_lease_expiring: true,
                sms_payment_reminder: false,
                sms_overdue_notice: true,
                sms_account_created: true,
                sender_email: null,
                sender_name: null,
                payment_reminder_days_before: 3,
                billing_issued_template: null,
                payment_reminder_template: null,
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Get notification settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get company_id and check admin role
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id, role')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        if (companyUser.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const body: NotificationSettingsInput = await req.json();

        // Upsert settings
        const { data, error } = await supabase
            .from('company_notification_settings')
            .upsert({
                company_id: companyUser.company_id,
                email_billing_issued: body.email_billing_issued,
                email_payment_reminder: body.email_payment_reminder,
                email_overdue_notice: body.email_overdue_notice,
                email_payment_confirmed: body.email_payment_confirmed,
                email_lease_expiring: body.email_lease_expiring,
                sms_payment_reminder: body.sms_payment_reminder,
                sms_overdue_notice: body.sms_overdue_notice,
                sms_account_created: body.sms_account_created,
                sender_email: body.sender_email,
                sender_name: body.sender_name,
                payment_reminder_days_before: body.payment_reminder_days_before ?? 3,
                billing_issued_template: body.billing_issued_template,
                payment_reminder_template: body.payment_reminder_template,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'company_id',
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to update notification settings:', error);
            return NextResponse.json(
                { error: 'Failed to update notification settings' },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Update notification settings error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
