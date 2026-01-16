import { NextRequest, NextResponse } from 'next/server';

type CreateQrRequest = {
    amount: number;
    transactionId: string;
    expiresIn?: number;
    items?: Array<{
        image?: string;
        title: string;
        remark?: string;
        amount: number;
        count: number;
    }>;
};

type QrLink = {
    name: string;
    description: string;
    logo: string;
    link: string;
    appStoreId?: string;
    androidPackageName?: string;
};

type BonumQrData = {
    invoiceId: string;
    qrCode: string;
    qrImage: string;
    links: QrLink[];
};

type BonumResponse = {
    traceId: string;
    errorCode: string | null;
    error: string | null;
    message: string | null;
    data: BonumQrData;
};

type TokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
};

export async function POST(request: NextRequest) {
    try {
        const BONUM_BASE_URL = process.env.BONUM_BASE_URL;
        const BONUM_TOKEN_BASE_URL = process.env.BONUM_TOKEN_BASE_URL;
        const BONUM_APP_SECRET = process.env.BONUM_APP_SECRET;
        const BONUM_DEFAULT_TERMINAL_ID = process.env.BONUM_DEFAULT_TERMINAL_ID;

        if (!BONUM_BASE_URL || !BONUM_TOKEN_BASE_URL || !BONUM_APP_SECRET || !BONUM_DEFAULT_TERMINAL_ID) {
            return NextResponse.json(
                { error: 'Missing required environment variables for Bonum payment' },
                { status: 500 }
            );
        }

        const body: CreateQrRequest = await request.json();
        const { amount, transactionId, expiresIn, items } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid amount' },
                { status: 400 }
            );
        }

        if (!transactionId) {
            return NextResponse.json(
                { error: 'Transaction ID is required' },
                { status: 400 }
            );
        }

        // Step 1: Get access token
        const tokenUrl = `${BONUM_BASE_URL}/ecommerce/auth/create`;
        const tokenResponse = await fetch(tokenUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `AppSecret ${BONUM_APP_SECRET}`,
                'X-TERMINAL-ID': BONUM_DEFAULT_TERMINAL_ID,
            },
        });

        if (!tokenResponse.ok) {
            const tokenError = await tokenResponse.json().catch(() => ({}));
            console.error('Bonum token error:', tokenError);
            return NextResponse.json(
                {
                    error: 'Failed to get access token',
                    message: tokenError.message || 'Token request failed',
                    statusCode: tokenResponse.status
                },
                { status: tokenResponse.status }
            );
        }

        const tokenData: TokenResponse = await tokenResponse.json();
        const accessToken = tokenData.accessToken;

        // Step 2: Create QR Code
        const qrUrl = `${BONUM_TOKEN_BASE_URL}/merchant/transaction/qr/create`;
        const qrPayload: {
            amount: number;
            transactionId: string;
            expiresIn: number;
            items?: CreateQrRequest['items'];
        } = {
            amount,
            transactionId,
            expiresIn: expiresIn || 600
        };

        // Add items if provided
        if (items && items.length > 0) {
            qrPayload.items = items;
        }

        const qrResponse = await fetch(qrUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(qrPayload),
        });

        const data: BonumResponse = await qrResponse.json();

        if (!qrResponse.ok || data.errorCode) {
            console.error('Bonum QR error:', data);
            return NextResponse.json(
                {
                    error: 'Failed to create QR',
                    message: data.message || data.error || 'Unknown error from Bonum',
                    statusCode: qrResponse.status
                },
                { status: qrResponse.status }
            );
        }

        return NextResponse.json(data.data, { status: 200 });

    } catch (error) {
        console.error('Bonum QR creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
