import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logFeaturesChange } from '@/lib/admin/audit-log';
import { FeaturesUpdateInput, FeaturePreset } from '@/types/admin';

// GET - Get company features
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { supabase } = await requireAdminRole('support', req);
        const { id } = await params;

        const { data: company, error } = await supabase
            .from('companies')
            .select('id, name, features')
            .eq('id', id)
            .single();

        if (error || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get feature presets from system settings
        const { data: preset } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'feature_presets')
            .single();

        return NextResponse.json({
            success: true,
            data: {
                features: company.features,
                presets: preset?.value || null,
            },
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// PUT - Update company features
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);
        const { id } = await params;

        const body: FeaturesUpdateInput = await req.json();

        // Validate input
        if (!body.features || typeof body.features !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Features object is required' },
                { status: 400 }
            );
        }

        // Get current company data
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select('id, name, features')
            .eq('id', id)
            .single();

        if (fetchError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        const oldFeatures = company.features as FeaturePreset;
        const newFeatures = { ...oldFeatures, ...body.features };

        // Update features
        const { data: updated, error: updateError } = await supabase
            .from('companies')
            .update({ features: newFeatures })
            .eq('id', id)
            .select('features')
            .single();

        if (updateError) {
            console.error('Error updating features:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to update features' },
                { status: 500 }
            );
        }

        // Log action
        await logFeaturesChange(
            admin,
            id,
            company.name,
            oldFeatures as unknown as Record<string, unknown>,
            newFeatures as unknown as Record<string, unknown>,
            {
                ipAddress: getClientIP(req),
                userAgent: getUserAgent(req),
            }
        );

        return NextResponse.json({
            success: true,
            data: { features: updated.features },
            message: 'Features updated successfully',
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// POST - Reset features to plan default
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);
        const { id } = await params;

        // Get current company and subscription
        const { data: company, error: fetchError } = await supabase
            .from('companies')
            .select(`
                id, name, features,
                subscriptions (plan)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !company) {
            return NextResponse.json(
                { success: false, error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get feature presets
        const { data: presetsData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'feature_presets')
            .single();

        if (!presetsData) {
            return NextResponse.json(
                { success: false, error: 'Feature presets not found' },
                { status: 500 }
            );
        }

        const presets = presetsData.value as Record<string, FeaturePreset>;
        const subscriptions = company.subscriptions as { plan: string }[] | null;
        const plan = subscriptions?.[0]?.plan || 'free';
        const defaultFeatures = presets[plan] || presets.free;

        if (!defaultFeatures) {
            return NextResponse.json(
                { success: false, error: 'Default features not found for plan' },
                { status: 500 }
            );
        }

        const oldFeatures = company.features as FeaturePreset;

        // Update features
        const { data: updated, error: updateError } = await supabase
            .from('companies')
            .update({ features: defaultFeatures })
            .eq('id', id)
            .select('features')
            .single();

        if (updateError) {
            console.error('Error resetting features:', updateError);
            return NextResponse.json(
                { success: false, error: 'Failed to reset features' },
                { status: 500 }
            );
        }

        // Log action
        await logFeaturesChange(
            admin,
            id,
            company.name,
            oldFeatures as unknown as Record<string, unknown>,
            defaultFeatures as unknown as Record<string, unknown>,
            {
                ipAddress: getClientIP(req),
                userAgent: getUserAgent(req),
            }
        );

        return NextResponse.json({
            success: true,
            data: { features: updated.features },
            message: `Features reset to ${plan} plan defaults`,
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
