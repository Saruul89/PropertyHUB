/**
 * POST /api/notifications/process-now - 開発用: キューを即座に処理
 * 本番環境では /api/cron/process-queue を使用
 */

import { NextResponse } from 'next/server';
import { processNotificationQueue } from '@/lib/notifications';

export async function POST() {
    // 開発環境のみ許可
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'This endpoint is only available in development' },
            { status: 403 }
        );
    }

    try {
        console.log('[ProcessNow] Processing notification queue...');
        const result = await processNotificationQueue(50);
        console.log('[ProcessNow] Result:', result);

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error('[ProcessNow] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
