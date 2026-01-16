'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';

export type QrLink = {
    name: string;
    description: string;
    logo: string;
    link: string;
    appStoreId?: string;
    androidPackageName?: string;
};

export type BonumQrData = {
    invoiceId: string;
    qrCode: string;
    qrImage: string;
    links: QrLink[];
};

export type CreateQrRequest = {
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

export type CreateQrError = {
    error: string;
    message?: string;
    statusCode?: number;
};

async function createBonumQr(request: CreateQrRequest): Promise<BonumQrData> {
    const response = await fetch('/api/bonum/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'QR код үүсгэхэд алдаа гарлаа');
    }

    return data;
}

export function useCreateBonumQr() {
    return useMutation({
        mutationFn: createBonumQr,
    });
}

// Helper function to generate transaction ID
export function generateTransactionId(billingId: string): string {
    const timestamp = Date.now();
    const shortId = billingId.slice(0, 8);
    return `PH-${shortId}-${timestamp}`;
}

// Payment Status Types
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';

export type PaymentStatusResponse = {
    invoiceId: string;
    status: PaymentStatus;
    amount: number;
    paidAmount: number;
    transactionId: string;
    paidAt: string | null;
    isPaid: boolean;
};

async function checkPaymentStatus(invoiceId: string): Promise<PaymentStatusResponse> {
    const response = await fetch(`/api/bonum/status?invoiceId=${invoiceId}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || data.error || 'Төлбөрийн төлөв шалгахад алдаа гарлаа');
    }

    return data;
}

export function usePaymentStatus(invoiceId: string | null, options?: { enabled?: boolean; refetchInterval?: number }) {
    return useQuery({
        queryKey: ['payment-status', invoiceId],
        queryFn: () => checkPaymentStatus(invoiceId!),
        enabled: !!invoiceId && (options?.enabled ?? true),
        refetchInterval: options?.refetchInterval ?? 5000, // Poll every 5 seconds by default
        staleTime: 0, // Always fetch fresh data
    });
}
