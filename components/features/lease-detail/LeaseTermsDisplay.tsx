'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaseTerms } from '@/types';
import { FileText } from 'lucide-react';

export interface LeaseTermsDisplayProps {
    terms: LeaseTerms;
}

export function LeaseTermsDisplay({ terms }: LeaseTermsDisplayProps) {
    const hasAnyTerms =
        terms.rent_increase_rate ||
        terms.rent_increase_interval ||
        terms.notice_period_days ||
        terms.renewal_terms ||
        terms.special_conditions;

    if (!hasAnyTerms) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    契約条件
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {terms.rent_increase_rate !== undefined && terms.rent_increase_rate > 0 && (
                        <div>
                            <div className="text-sm text-gray-500">賃料上昇率</div>
                            <div className="font-medium">{terms.rent_increase_rate}%/年</div>
                        </div>
                    )}

                    {terms.rent_increase_interval !== undefined && terms.rent_increase_interval > 0 && (
                        <div>
                            <div className="text-sm text-gray-500">賃料見直し間隔</div>
                            <div className="font-medium">{terms.rent_increase_interval}ヶ月ごと</div>
                        </div>
                    )}

                    {terms.notice_period_days !== undefined && terms.notice_period_days > 0 && (
                        <div>
                            <div className="text-sm text-gray-500">解約予告期間</div>
                            <div className="font-medium">{terms.notice_period_days}日前</div>
                        </div>
                    )}

                    {terms.renewal_terms && (
                        <div className="sm:col-span-2">
                            <div className="text-sm text-gray-500">更新条件</div>
                            <div className="font-medium whitespace-pre-wrap">{terms.renewal_terms}</div>
                        </div>
                    )}

                    {terms.special_conditions && (
                        <div className="sm:col-span-2">
                            <div className="text-sm text-gray-500">特約事項</div>
                            <div className="font-medium whitespace-pre-wrap">{terms.special_conditions}</div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
