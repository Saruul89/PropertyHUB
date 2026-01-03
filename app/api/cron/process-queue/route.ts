/**
 * POST /api/cron/process-queue - Мэдэгдлийн дараалал боловсруулах
 * Ажиллах хугацаа: Минут бүр
 * Триггер: pending төлөвтэй мэдэгдлийг боловсруулах
 */

import { NextRequest, NextResponse } from 'next/server';
import { processNotificationQueue } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await processNotificationQueue(50);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('Process queue cron error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
