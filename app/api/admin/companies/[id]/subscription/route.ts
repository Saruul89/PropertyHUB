import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logSubscriptionChange } from '@/lib/admin/audit-log';
import { SubscriptionUpdateInput } from '@/types/admin';

// GET - Get company subscription
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await requireAdminRole('support', req);
        const { id } = await params;

        // Get company with subscription
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', id)
            .single();

        if (companyError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('company_id', id)
            .single();

        // Get current usage
        const [propertiesRes, unitsRes] = await Promise.all([
            supabase.from('properties').select('id', { count: 'exact', head: true }).eq('company_id', id),
            supabase.from('units').select('id', { count: 'exact', head: true })
                .in('property_id',
                    (await supabase.from('properties').select('id').eq('company_id', id)).data?.map(p => p.id) || []
                ),
        ]);

        // Get plan configs from system settings
        const { data: plansData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'plans')
            .single();

        return NextResponse.json({
            success: true,
            data: {
                subscription: subscription || null,
                usage: {
                    properties: propertiesRes.count || 0,
                    units: unitsRes.count || 0,
                },
                plans: plansData?.value || null,
            },
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// PUT - Update company subscription
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);
        const { id } = await params;

        const body: SubscriptionUpdateInput = await req.json();

        // Get company
        const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', id)
            .single();

        if (companyError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get current subscription
        const { data: currentSub, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('company_id', id)
            .single();

        // Prepare update data
        const updateData: Record<string, unknown> = {};

        if (body.plan !== undefined) updateData.plan = body.plan;
        if (body.price_per_month !== undefined) updateData.price_per_month = body.price_per_month;
        if (body.max_properties !== undefined) updateData.max_properties = body.max_properties;
        if (body.max_units !== undefined) updateData.max_units = body.max_units;
        if (body.status !== undefined) updateData.status = body.status;
        if (body.end_date !== undefined) updateData.current_period_end = body.end_date;

        // If plan is changing, apply plan defaults unless explicitly set
        if (body.plan && body.plan !== currentSub?.plan) {
            const { data: plansData } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'plans')
                .single();

            if (plansData?.value) {
                const planConfig = (plansData.value as Record<string, {
                    max_properties: number;
                    max_units: number;
                    price: number;
                }>)[body.plan];

                if (planConfig) {
                    if (body.max_properties === undefined) {
                        updateData.max_properties = planConfig.max_properties;
                    }
                    if (body.max_units === undefined) {
                        updateData.max_units = planConfig.max_units;
                    }
                    if (body.price_per_month === undefined) {
                        updateData.price_per_month = planConfig.price;
                    }
                }
            }

            // Apply feature presets when plan changes
            const { data: presetsData } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', 'feature_presets')
                .single();

            if (presetsData?.value) {
                const presets = presetsData.value as Record<string, unknown>;
                const planFeatures = presets[body.plan];
                if (planFeatures) {
                    await supabase
                        .from('companies')
                        .update({ features: planFeatures })
                        .eq('id', id);
                }
            }
        }

        let result;

        if (currentSub) {
            // Update existing subscription
            const { data, error } = await supabase
                .from('subscriptions')
                .update(updateData)
                .eq('company_id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating subscription:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to update subscription' },
                    { status: 500 }
                );
            }
            result = data;
        } else {
            // Create new subscription
            const { data, error } = await supabase
                .from('subscriptions')
                .insert({
                    company_id: id,
                    plan: body.plan || 'free',
                    price_per_month: body.price_per_month || 0,
                    max_properties: body.max_properties || 1,
                    max_units: body.max_units || 50,
                    status: body.status || 'active',
                    current_period_start: new Date().toISOString().split('T')[0],
                    ...updateData,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating subscription:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to create subscription' },
                    { status: 500 }
                );
            }
            result = data;
        }

        // Log action
        await logSubscriptionChange(
            admin,
            id,
            company.name,
            (currentSub || {}) as Record<string, unknown>,
            updateData,
            {
                ipAddress: getClientIP(req),
                userAgent: getUserAgent(req),
            }
        );

        return NextResponse.json({
            success: true,
            data: { subscription: result },
            message: 'Subscription updated successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
