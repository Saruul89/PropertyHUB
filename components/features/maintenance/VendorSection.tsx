'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench } from 'lucide-react';

interface VendorData {
    vendor_name?: string;
    vendor_phone?: string;
    estimated_cost?: number;
    actual_cost?: number;
}

interface VendorSectionProps {
    value: VendorData;
    onChange: (data: VendorData) => void;
    readOnly?: boolean;
    showActualCost?: boolean;
}

export function VendorSection({
    value,
    onChange,
    readOnly = false,
    showActualCost = false,
}: VendorSectionProps) {
    const handleChange = (field: keyof VendorData, val: string | number | undefined) => {
        onChange({ ...value, [field]: val });
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('mn-MN').format(amount) + '₮';
    };

    if (readOnly) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        業者情報
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">業者名</p>
                            <p className="font-medium">{value.vendor_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">連絡先</p>
                            <p className="font-medium">{value.vendor_phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">見積金額</p>
                            <p className="font-medium">{formatCurrency(value.estimated_cost)}</p>
                        </div>
                        {showActualCost && (
                            <div>
                                <p className="text-sm text-gray-500">実費</p>
                                <p className="font-medium">{formatCurrency(value.actual_cost)}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                業者情報
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="vendor_name">業者名</Label>
                    <Input
                        id="vendor_name"
                        placeholder="業者名を入力"
                        value={value.vendor_name || ''}
                        onChange={(e) => handleChange('vendor_name', e.target.value || undefined)}
                    />
                </div>

                <div>
                    <Label htmlFor="vendor_phone">連絡先</Label>
                    <Input
                        id="vendor_phone"
                        placeholder="電話番号を入力"
                        value={value.vendor_phone || ''}
                        onChange={(e) => handleChange('vendor_phone', e.target.value || undefined)}
                    />
                </div>

                <div>
                    <Label htmlFor="estimated_cost">見積金額</Label>
                    <Input
                        id="estimated_cost"
                        type="number"
                        placeholder="見積金額を入力"
                        value={value.estimated_cost || ''}
                        onChange={(e) =>
                            handleChange(
                                'estimated_cost',
                                e.target.value ? parseFloat(e.target.value) : undefined
                            )
                        }
                    />
                </div>

                {showActualCost && (
                    <div>
                        <Label htmlFor="actual_cost">実費</Label>
                        <Input
                            id="actual_cost"
                            type="number"
                            placeholder="実費を入力"
                            value={value.actual_cost || ''}
                            onChange={(e) =>
                                handleChange(
                                    'actual_cost',
                                    e.target.value ? parseFloat(e.target.value) : undefined
                                )
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
