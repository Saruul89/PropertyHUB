'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Billing, PaymentMethod } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

interface PaymentFormProps {
    billing: Billing;
    onClose: () => void;
    onPaymentRecorded: () => void;
}

const paymentSchema = z.object({
    amount: z.number().min(1, 'Дүн 1-ээс дээш байх ёстой'),
    payment_date: z.string().min(1, 'Төлсөн огноо заавал бөглөх ёстой'),
    payment_method: z.enum(['cash', 'bank_transfer', 'card']),
    reference_number: z.string().optional(),
    notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const paymentMethodLabels: Record<PaymentMethod, string> = {
    cash: 'Бэлэн мөнгө',
    bank_transfer: 'Банкны шилжүүлэг',
    card: 'Карт',
};

export function PaymentForm({ billing, onClose, onPaymentRecorded }: PaymentFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remainingAmount = billing.total_amount - billing.paid_amount;

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: remainingAmount,
            payment_method: 'cash',
            payment_date: new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = async (data: PaymentFormData) => {
        setSubmitting(true);
        setError(null);

        const supabase = createClient();

        // Create payment
        const { data: newPayment, error: paymentError } = await supabase
            .from('payments')
            .insert({
                billing_id: billing.id,
                lease_id: billing.lease_id,
                company_id: billing.company_id,
                amount: data.amount,
                payment_date: data.payment_date,
                payment_month: billing.billing_month,
                payment_method: data.payment_method,
                reference_number: data.reference_number || null,
                notes: data.notes || null,
                status: 'completed',
            })
            .select()
            .single();

        if (paymentError || !newPayment) {
            setError(paymentError?.message || 'Төлбөр бүртгэхэд алдаа гарлаа');
            setSubmitting(false);
            return;
        }

        // Update billing status and paid_amount
        const newPaidAmount = billing.paid_amount + data.amount;
        let newStatus: Billing['status'] = billing.status;

        if (newPaidAmount >= billing.total_amount) {
            newStatus = 'paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'partial';
        }

        const { error: updateError } = await supabase
            .from('billings')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
            })
            .eq('id', billing.id);

        if (updateError) {
            setError(updateError.message);
            setSubmitting(false);
            return;
        }

        setSubmitting(false);
        onPaymentRecorded();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Төлбөр бүртгэх</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div>
                            <Label htmlFor="amount">Дүн</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500">₮</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    {...register('amount', { valueAsNumber: true })}
                                />
                            </div>
                            {errors.amount && (
                                <p className="mt-1 text-sm text-red-500">{errors.amount.message}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500">
                                Үлдэгдэл: ₮{remainingAmount.toLocaleString()}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="payment_date">Төлсөн огноо</Label>
                            <Input
                                id="payment_date"
                                type="date"
                                {...register('payment_date')}
                            />
                            {errors.payment_date && (
                                <p className="mt-1 text-sm text-red-500">{errors.payment_date.message}</p>
                            )}
                        </div>

                        <div>
                            <Label>Төлбөрийн хэлбэр</Label>
                            <div className="mt-2 flex gap-2">
                                {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
                                    <label
                                        key={method}
                                        className="flex cursor-pointer items-center gap-2"
                                    >
                                        <input
                                            type="radio"
                                            value={method}
                                            {...register('payment_method')}
                                        />
                                        {paymentMethodLabels[method]}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="reference_number">Лавлах дугаар (заавал биш)</Label>
                            <Input
                                id="reference_number"
                                {...register('reference_number')}
                                placeholder="Шилжүүлгийн дугаар гэх мэт"
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Тэмдэглэл (заавал биш)</Label>
                            <textarea
                                id="notes"
                                {...register('notes')}
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                            >
                                Цуцлах
                            </Button>
                            <Button type="submit" className="flex-1" disabled={submitting}>
                                {submitting ? 'Бүртгэж байна...' : 'Төлбөр бүртгэх'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
