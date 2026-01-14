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
                        Гүйцэтгэгчийн мэдээлэл
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Гүйцэтгэгчийн нэр</p>
                            <p className="font-medium">{value.vendor_name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Утас</p>
                            <p className="font-medium">{value.vendor_phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Төсөвт өртөг</p>
                            <p className="font-medium">{formatCurrency(value.estimated_cost)}</p>
                        </div>
                        {showActualCost && (
                            <div>
                                <p className="text-sm text-gray-500">Бодит зардал</p>
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
                Гүйцэтгэгчийн мэдээлэл
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="vendor_name">Гүйцэтгэгчийн нэр</Label>
                    <Input
                        id="vendor_name"
                        placeholder="Нэр оруулах"
                        value={value.vendor_name || ''}
                        onChange={(e) => handleChange('vendor_name', e.target.value || undefined)}
                    />
                </div>

                <div>
                    <Label htmlFor="vendor_phone">Утас</Label>
                    <Input
                        id="vendor_phone"
                        placeholder="Утас оруулах"
                        value={value.vendor_phone || ''}
                        onChange={(e) => handleChange('vendor_phone', e.target.value || undefined)}
                    />
                </div>

                <div>
                    <Label htmlFor="estimated_cost">Төсөвт өртөг</Label>
                    <Input
                        id="estimated_cost"
                        type="number"
                        placeholder="Төсөвт өртөг оруулах"
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
                        <Label htmlFor="actual_cost">Бодит зардал</Label>
                        <Input
                            id="actual_cost"
                            type="number"
                            placeholder="Бодит зардал оруулах"
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
