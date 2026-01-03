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
            <h4 className="font-medium text-gray-900">契約条件</h4>

            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="rent_increase_rate">年間賃料上昇率 (%)</Label>
                    <Input
                        id="rent_increase_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="例: 3"
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
                    <Label htmlFor="rent_increase_interval">賃料見直し間隔 (月)</Label>
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
                        <option value="">選択してください</option>
                        <option value="6">6ヶ月</option>
                        <option value="12">12ヶ月（1年）</option>
                        <option value="24">24ヶ月（2年）</option>
                        <option value="36">36ヶ月（3年）</option>
                    </select>
                </div>

                <div>
                    <Label htmlFor="notice_period_days">解約予告期間 (日)</Label>
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
                        <option value="">選択してください</option>
                        <option value="30">30日前</option>
                        <option value="60">60日前</option>
                        <option value="90">90日前</option>
                        <option value="180">180日前</option>
                    </select>
                </div>
            </div>

            <div>
                <Label htmlFor="renewal_terms">更新条件</Label>
                <textarea
                    id="renewal_terms"
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                    rows={2}
                    placeholder="契約更新に関する条件を入力"
                    value={value.renewal_terms ?? ''}
                    onChange={(e) => handleChange('renewal_terms', e.target.value || undefined)}
                    disabled={readOnly}
                />
            </div>

            <div>
                <Label htmlFor="special_conditions">特約事項</Label>
                <textarea
                    id="special_conditions"
                    className="mt-1 w-full rounded-md border p-2 disabled:bg-gray-100"
                    rows={3}
                    placeholder="特別な契約条件がある場合は入力"
                    value={value.special_conditions ?? ''}
                    onChange={(e) => handleChange('special_conditions', e.target.value || undefined)}
                    disabled={readOnly}
                />
            </div>
        </div>
    );
}
