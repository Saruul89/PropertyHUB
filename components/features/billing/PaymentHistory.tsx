'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Payment, PaymentMethod } from '@/types';
import { CreditCard, Calendar } from 'lucide-react';

interface PaymentHistoryProps {
    payments: Payment[];
    showTitle?: boolean;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Бэлэн мөнгө',
    bank_transfer: 'Банкны шилжүүлэг',
    card: 'Карт',
};

export function PaymentHistory({ payments, showTitle = true }: PaymentHistoryProps) {
    return (
        <Card>
            {showTitle && (
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Төлбөрийн түүх
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className={showTitle ? '' : 'pt-6'}>
                {payments.length === 0 ? (
                    <p className="text-center text-gray-500">Төлбөрийн түүх байхгүй</p>
                ) : (
                    <div className="space-y-3">
                        {payments.map((payment) => (
                            <div
                                key={payment.id}
                                className="flex items-center justify-between rounded-lg border p-4"
                            >
                                <div>
                                    <p className="font-medium">
                                        ₮{payment.amount.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(payment.payment_date).toLocaleDateString('mn-MN')}
                                        {payment.payment_method && (
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
                                                {paymentMethodLabels[payment.payment_method as PaymentMethod]}
                                            </span>
                                        )}
                                    </div>
                                    {payment.notes && (
                                        <p className="mt-1 text-sm text-gray-500">{payment.notes}</p>
                                    )}
                                </div>
                                {payment.reference_number && (
                                    <span className="font-mono text-sm text-gray-500">
                                        {payment.reference_number}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
