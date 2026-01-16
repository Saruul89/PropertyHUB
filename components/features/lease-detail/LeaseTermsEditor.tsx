'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LeaseTerms } from '@/types';

interface LeaseTermsEditorProps {
    value: LeaseTerms;
    onChange: (terms: LeaseTerms) => void;
    readOnly?: boolean;
}

export function LeaseTermsEditor({
    value,
    onChange,
    readOnly = false,
}: LeaseTermsEditorProps) {
    const handleChange = (field: keyof LeaseTerms, val: string | number | undefined) => {
        onChange({ ...value, [field]: val });
    };

    return (
        <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900">Гэрээний нөхцөл</h4>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="rent_increase_rate">Жилийн түрээсийн өсөлт (%)</Label>
                    <Input
                        id="rent_increase_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="Жишээ: 3"
                        value={value.rent_increase_rate ?? ''}
                        onChange={(e) =>
                            handleChange(
                                'rent_increase_rate',
                                e.target.value ? parseFloat(e.target.value) : undefined
                            )
                        }
                        disabled={readOnly}
                    />
                </div>

                <div>
                    <Label htmlFor="rent_increase_interval">Түрээс шинэчлэх хугацаа (сар)</Label>
                    <select
                        id="rent_increase_interval"
                        className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                        value={value.rent_increase_interval ?? ''}
                        onChange={(e) =>
                            handleChange(
                                'rent_increase_interval',
                                e.target.value ? parseInt(e.target.value) : undefined
                            )
                        }
                        disabled={readOnly}
                    >
                        <option value="">Сонгоно уу</option>
                        <option value="6">6 сар</option>
                        <option value="12">12 сар (1 жил)</option>
                        <option value="24">24 сар (2 жил)</option>
                        <option value="36">36 сар (3 жил)</option>
                    </select>
                </div>

                <div>
                    <Label htmlFor="notice_period_days">Цуцлах мэдэгдлийн хугацаа (хоног)</Label>
                    <select
                        id="notice_period_days"
                        className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                        value={value.notice_period_days ?? ''}
                        onChange={(e) =>
                            handleChange(
                                'notice_period_days',
                                e.target.value ? parseInt(e.target.value) : undefined
                            )
                        }
                        disabled={readOnly}
                    >
                        <option value="">Сонгоно уу</option>
                        <option value="30">30 хоногийн өмнө</option>
                        <option value="60">60 хоногийн өмнө</option>
                        <option value="90">90 хоногийн өмнө</option>
                        <option value="180">180 хоногийн өмнө</option>
                    </select>
                </div>
            </div>

            <div>
                <Label htmlFor="renewal_terms">Сунгах нөхцөл</Label>
                <textarea
                    id="renewal_terms"
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                    rows={2}
                    placeholder="Гэрээ сунгах нөхцөлийг оруулна уу"
                    value={value.renewal_terms ?? ''}
                    onChange={(e) => handleChange('renewal_terms', e.target.value || undefined)}
                    disabled={readOnly}
                />
            </div>

            <div>
                <Label htmlFor="special_conditions">Тусгай нөхцөл</Label>
                <textarea
                    id="special_conditions"
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                    rows={3}
                    placeholder="Тусгай гэрээний нөхцөл байвал оруулна уу"
                    value={value.special_conditions ?? ''}
                    onChange={(e) => handleChange('special_conditions', e.target.value || undefined)}
                    disabled={readOnly}
                />
            </div>
        </div>
    );
}
