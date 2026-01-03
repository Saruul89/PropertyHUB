'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { useTenant } from '@/hooks';
import { FeeType, TenantMeterSubmission, MeterReading, MeterSubmissionStatus } from '@/types';
import {
    Gauge,
    Camera,
    Send,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    History,
} from 'lucide-react';

const statusConfig: Record<
    MeterSubmissionStatus,
    { label: string; color: string; icon: React.ElementType }
> = {
    pending: { label: 'Хүлээгдэж буй', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    approved: { label: 'Баталгаажсан', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    rejected: { label: 'Татгалзсан', color: 'bg-red-100 text-red-800', icon: XCircle },
};

interface MeterTypeWithReading extends FeeType {
    lastReading?: number;
    pendingSubmission?: TenantMeterSubmission;
}

export default function TenantMeterSubmitPage() {
    const { tenant, lease, company, loading: tenantLoading } = useTenant();
    const [meterTypes, setMeterTypes] = useState<MeterTypeWithReading[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState<MeterTypeWithReading | null>(null);
    const [readingValue, setReadingValue] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [recentSubmissions, setRecentSubmissions] = useState<TenantMeterSubmission[]>([]);

    useEffect(() => {
        if (tenant && lease && company) {
            fetchMeterTypes();
            fetchRecentSubmissions();
        }
    }, [tenant, lease, company]);

    const fetchMeterTypes = async () => {
        const supabase = createClient();

        // Get metered fee types for the company
        const { data: feeTypes } = await supabase
            .from('fee_types')
            .select('*')
            .eq('company_id', company?.id)
            .eq('is_active', true)
            .eq('calculation_type', 'metered')
            .order('display_order');

        if (!feeTypes || feeTypes.length === 0) {
            setMeterTypes([]);
            setLoading(false);
            return;
        }

        const feeTypeIds = (feeTypes as FeeType[]).map((f) => f.id);

        // Batch fetch: Get all last readings for this unit in one query
        const { data: allReadings } = await supabase
            .from('meter_readings')
            .select('fee_type_id, current_reading, reading_date')
            .eq('unit_id', lease?.unit_id)
            .in('fee_type_id', feeTypeIds)
            .order('reading_date', { ascending: false });

        // Batch fetch: Get all pending submissions for this tenant in one query
        const { data: allPendingSubmissions } = await supabase
            .from('tenant_meter_submissions')
            .select('*')
            .eq('tenant_id', tenant?.id)
            .in('fee_type_id', feeTypeIds)
            .eq('status', 'pending')
            .order('submitted_at', { ascending: false });

        // Create maps for efficient lookup (take first occurrence since ordered by date desc)
        const lastReadingMap = new Map<string, number>();
        (allReadings as MeterReading[] | null)?.forEach((reading) => {
            if (!lastReadingMap.has(reading.fee_type_id)) {
                lastReadingMap.set(reading.fee_type_id, reading.current_reading);
            }
        });

        const pendingSubmissionMap = new Map<string, TenantMeterSubmission>();
        (allPendingSubmissions as TenantMeterSubmission[] | null)?.forEach((submission) => {
            if (!pendingSubmissionMap.has(submission.fee_type_id)) {
                pendingSubmissionMap.set(submission.fee_type_id, submission);
            }
        });

        // Combine data
        const typesWithData: MeterTypeWithReading[] = (feeTypes as FeeType[]).map((feeType) => ({
            ...feeType,
            lastReading: lastReadingMap.get(feeType.id) ?? 0,
            pendingSubmission: pendingSubmissionMap.get(feeType.id),
        }));

        setMeterTypes(typesWithData);
        setLoading(false);
    };

    const fetchRecentSubmissions = async () => {
        const supabase = createClient();

        const { data } = await supabase
            .from('tenant_meter_submissions')
            .select('*, fee_types(name)')
            .eq('tenant_id', tenant?.id)
            .order('submitted_at', { ascending: false })
            .limit(10);

        if (data) {
            setRecentSubmissions(data);
        }
    };

    const handleSubmit = async () => {
        if (!selectedType || !readingValue) {
            setError('Тоолуурын заалт оруулна уу');
            return;
        }

        const value = parseFloat(readingValue);
        if (isNaN(value)) {
            setError('Зөв тоо оруулна уу');
            return;
        }

        if (value < (selectedType.lastReading ?? 0)) {
            setError('Өмнөх заалтаас бага утга оруулах боломжгүй');
            return;
        }

        setSubmitting(true);
        setError('');

        const supabase = createClient();

        const { error: insertError } = await supabase.from('tenant_meter_submissions').insert({
            tenant_id: tenant?.id,
            unit_id: lease?.unit_id,
            fee_type_id: selectedType.id,
            submitted_reading: value,
            notes: notes || null,
        });

        setSubmitting(false);

        if (insertError) {
            setError('Илгээхэд алдаа гарлаа: ' + insertError.message);
        } else {
            setSuccess(true);
            setReadingValue('');
            setNotes('');
            fetchMeterTypes();
            fetchRecentSubmissions();
            setTimeout(() => {
                setSelectedType(null);
                setSuccess(false);
            }, 2000);
        }
    };

    if (tenantLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-gray-500">Ачааллаж байна...</div>
            </div>
        );
    }

    // Check if tenant_meter_submit feature is enabled
    if (!company?.features?.tenant_meter_submit) {
        return (
            <div className="p-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Gauge className="mb-4 h-12 w-12 text-gray-400" />
                        <p className="text-gray-600">Тоолуур бүртгэх боломжгүй</p>
                        <p className="text-sm text-gray-500">Удирдлагын компанитай холбогдоно уу</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="mb-6 text-2xl font-bold">Тоолуур бүртгэх</h1>

            {/* Meter Types */}
            <div className="mb-8 grid gap-4 md:grid-cols-2">
                {meterTypes.map((type) => {
                    const hasPending = !!type.pendingSubmission;

                    return (
                        <Card
                            key={type.id}
                            className={`cursor-pointer transition-all ${
                                selectedType?.id === type.id
                                    ? 'border-green-500 ring-2 ring-green-200'
                                    : hasPending
                                      ? 'border-yellow-200 bg-yellow-50'
                                      : 'hover:border-green-300'
                            }`}
                            onClick={() => !hasPending && setSelectedType(type)}
                        >
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`rounded-lg p-2 ${
                                                hasPending ? 'bg-yellow-100' : 'bg-cyan-100'
                                            }`}
                                        >
                                            <Gauge
                                                className={`h-5 w-5 ${
                                                    hasPending ? 'text-yellow-600' : 'text-cyan-600'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium">{type.name}</p>
                                            <p className="text-sm text-gray-500">
                                                Өмнөх заалт: {(type.lastReading ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    {hasPending && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                            <Clock className="h-3 w-3" />
                                            Хүлээгдэж буй
                                        </span>
                                    )}
                                </div>
                                {hasPending && type.pendingSubmission && (
                                    <div className="mt-3 rounded bg-yellow-100/50 p-2 text-sm">
                                        <p>
                                            Илгээсэн заалт:{' '}
                                            <span className="font-medium">
                                                {type.pendingSubmission.submitted_reading.toLocaleString()}
                                            </span>
                                        </p>
                                        <p className="text-xs text-yellow-700">
                                            {new Date(
                                                type.pendingSubmission.submitted_at
                                            ).toLocaleString('mn-MN')}
                                            -д илгээсэн
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Submit Form */}
            {selectedType && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gauge className="h-5 w-5" />
                            {selectedType.name}-ийн тоолуурын заалт илгээх
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {success ? (
                            <div className="flex flex-col items-center py-8 text-green-600">
                                <CheckCircle className="mb-2 h-12 w-12" />
                                <p className="font-medium">Илгээлт амжилттай</p>
                                <p className="text-sm text-gray-500">
                                    Удирдлагын компаниас баталгаажуулна
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="rounded-lg bg-gray-50 p-4">
                                    <p className="text-sm text-gray-600">
                                        Өмнөх заалт:{' '}
                                        <span className="text-lg font-bold">
                                            {(selectedType.lastReading ?? 0).toLocaleString()}
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="reading">Одоогийн тоолуурын заалт</Label>
                                    <Input
                                        id="reading"
                                        type="number"
                                        value={readingValue}
                                        onChange={(e) => {
                                            setReadingValue(e.target.value);
                                            setError('');
                                        }}
                                        placeholder={(selectedType.lastReading ?? 0).toString()}
                                        className="mt-1 text-lg"
                                    />
                                    {error && (
                                        <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="notes">Тэмдэглэл (сонголтоор)</Label>
                                    <Input
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Нэмэлт мэдээлэл бичих"
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedType(null);
                                            setReadingValue('');
                                            setNotes('');
                                            setError('');
                                        }}
                                    >
                                        Цуцлах
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSubmit}
                                        disabled={submitting || !readingValue}
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        {submitting ? 'Илгээж байна...' : 'Илгээх'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Recent Submissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Илгээлтийн түүх
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentSubmissions.length === 0 ? (
                        <p className="py-8 text-center text-gray-500">Илгээлтийн түүх байхгүй</p>
                    ) : (
                        <div className="space-y-3">
                            {recentSubmissions.map((submission) => {
                                const statusInfo = statusConfig[submission.status];
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={submission.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <p className="font-medium">
                                                {(submission as { fee_types?: { name: string } }).fee_types?.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Илгээсэн заалт: {submission.submitted_reading.toLocaleString()}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(submission.submitted_at).toLocaleString('mn-MN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {statusInfo.label}
                                            </span>
                                            {submission.status === 'rejected' &&
                                                submission.rejection_reason && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        Шалтгаан: {submission.rejection_reason}
                                                    </p>
                                                )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
