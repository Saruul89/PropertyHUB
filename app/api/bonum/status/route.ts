import { NextRequest, NextResponse } from 'next/server';

type TokenResponse = {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
};

type InvoiceStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

type InvoiceStatusResponse = {
    traceId: string;
    errorCode: string | null;
    error: string | null;
    message: string | null;
    data: {
        invoiceId: string;
        status: InvoiceStatus;
        amount: number;
        paidAmount: number;
        transactionId: string;
        createdAt: string;
        paidAt: string | null;
    } | null;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get('invoiceId');

        if (!invoiceId) {
            return NextResponse.json(
                { error: 'Invoice ID is required' },
                { status: 400 }
            );
        }

        const BONUM_BASE_URL = process.env.BONUM_BASE_URL;
        const BONUM_TOKEN_BASE_URL = process.env.BONUM_TOKEN_BASE_URL;
        const BONUM_APP_SECRET = process.env.BONUM_APP_SECRET;
        const BONUM_DEFAULT_TERMINAL_ID = process.env.BONUM_DEFAULT_TERMINAL_ID;

        if (!BONUM_BASE_URL || !BONUM_TOKEN_BASE_URL || !BONUM_APP_SECRET || !BONUM_DEFAULT_TERMINAL_ID) {
            return NextResponse.json(
                { error: 'Missing required environment variables' },
                { status: 500 }
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
                },
                { status: tokenResponse.status }
            );
        }

        const tokenData: TokenResponse = await tokenResponse.json();
        const accessToken = tokenData.accessToken;

        // Step 2: Get invoice status
        const statusUrl = `${BONUM_TOKEN_BASE_URL}/merchant/transaction/invoice/${invoiceId}`;
        const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const data: InvoiceStatusResponse = await statusResponse.json();

        if (!statusResponse.ok || data.errorCode) {
            console.error('Bonum status check error:', data);
            return NextResponse.json(
                {
                    error: 'Failed to check payment status',
                    message: data.message || data.error || 'Unknown error',
                },
                { status: statusResponse.status }
            );
        }

        return NextResponse.json({
            invoiceId: data.data?.invoiceId,
            status: data.data?.status,
            amount: data.data?.amount,
            paidAmount: data.data?.paidAmount,
            transactionId: data.data?.transactionId,
            paidAt: data.data?.paidAt,
            isPaid: data.data?.status === 'PAID',
        });

    } catch (error) {
        console.error('Payment status check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
