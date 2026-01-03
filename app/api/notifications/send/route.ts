/**
 * POST /api/notifications/send - Гараар мэдэгдэл илгээх
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { queueNotification } from '@/lib/notifications';
import type { SendNotificationInput } from '@/types';

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get company_id
        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id, role')
            .eq('user_id', user.id)
            .single();

        if (!companyUser) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const body: SendNotificationInput = await req.json();

        if (!body.type || !body.channels || !body.recipient_ids || body.recipient_ids.length === 0) {
            return NextResponse.json(
                { error: 'type, channels, and recipient_ids are required' },
                { status: 400 }
            );
        }

        // Get company info for templates
        const { data: company } = await supabase
            .from('companies')
            .select('name, phone, features')
            .eq('id', companyUser.company_id)
            .single();

        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Check feature flags
        const features = company.features as Record<string, boolean>;
        const enabledChannels = body.channels.filter(channel => {
            if (channel === 'email') return features.email_notifications;
            if (channel === 'sms') return features.sms_notifications;
            return false;
        });

        if (enabledChannels.length === 0) {
            return NextResponse.json(
                { error: 'No notification channels are enabled for this company' },
                { status: 400 }
            );
        }

        const results = {
            queued: 0,
            skipped: 0,
            errors: [] as string[],
        };

        // Queue notifications for each recipient and channel
        for (const recipientId of body.recipient_ids) {
            for (const channel of enabledChannels) {
                const result = await queueNotification({
                    company_id: companyUser.company_id,
                    recipient_type: 'tenant',
                    recipient_id: recipientId,
                    notification_type: body.type,
                    channel,
                    template_data: {
                        ...body.template_data,
                        company_name: company.name,
                        company_phone: company.phone || '',
                    },
                });

                if (result.success) {
                    if (result.skipped) {
                        results.skipped++;
                    } else {
                        results.queued++;
                    }
                } else if (result.error) {
                    results.errors.push(result.error);
                }
            }
        }

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error('Send notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
