import { NextRequest, NextResponse } from 'next/server';
import {
    requireAdminRole,
    createErrorResponse,
    getClientIP,
    getUserAgent,
} from '@/lib/admin/require-admin';
import { logSettingsChange } from '@/lib/admin/audit-log';

// GET - Get all system settings
export async function GET(req: NextRequest) {
    try {
        const { supabase } = await requireAdminRole('support', req);

        const { data, error } = await supabase
            .from('system_settings')
            .select('*')
            .order('key');

        if (error) {
            console.error('Error fetching settings:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch settings' },
                { status: 500 }
            );
        }

        // Convert to object format
        const settings: Record<string, unknown> = {};
        data.forEach(item => {
            settings[item.key] = item.value;
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// PUT - Update system settings
export async function PUT(req: NextRequest) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);

        const body = await req.json();

        // Validate input
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, error: 'Settings object is required' },
                { status: 400 }
            );
        }

        const updates: Array<{ key: string; oldValue: unknown; newValue: unknown }> = [];

        // Process each setting
        for (const [key, value] of Object.entries(body)) {
            // Get current value
            const { data: current } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', key)
                .single();

            if (current) {
                // Update existing
                const { error } = await supabase
                    .from('system_settings')
                    .update({
                        value,
                        updated_by: admin.id,
                    })
                    .eq('key', key);

                if (error) {
                    console.error(`Error updating setting ${key}:`, error);
                    continue;
                }

                updates.push({ key, oldValue: current.value, newValue: value });
            } else {
                // Insert new
                const { error } = await supabase
                    .from('system_settings')
                    .insert({
                        key,
                        value,
                        updated_by: admin.id,
                    });

                if (error) {
                    console.error(`Error creating setting ${key}:`, error);
                    continue;
                }

                updates.push({ key, oldValue: null, newValue: value });
            }
        }

        // Log each update
        for (const update of updates) {
            await logSettingsChange(
                admin,
                update.key,
                update.oldValue,
                update.newValue,
                {
                    ipAddress: getClientIP(req),
                    userAgent: getUserAgent(req),
                }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} settings`,
            updates: updates.map(u => u.key),
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}

// PATCH - Update single setting
export async function PATCH(req: NextRequest) {
    try {
        const { admin, supabase } = await requireAdminRole('admin', req);

        const { key, value } = await req.json();

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'Setting key is required' },
                { status: 400 }
            );
        }

        // Get current value
        const { data: current } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single();

        // Upsert setting
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_by: admin.id,
            });

        if (error) {
            console.error('Error updating setting:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update setting' },
                { status: 500 }
            );
        }

        // Log action
        await logSettingsChange(
            admin,
            key,
            current?.value,
            value,
            {
                ipAddress: getClientIP(req),
                userAgent: getUserAgent(req),
            }
        );

        return NextResponse.json({
            success: true,
            message: `Setting "${key}" updated successfully`,
        });
    } catch (error) {
        return createErrorResponse(error);
    }
}
