'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Copy } from 'lucide-react';

interface TenantLoginInfoProps {
    phone: string;
    initialPassword: string;
}

export function TenantLoginInfo({ phone, initialPassword }: TenantLoginInfoProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(
            `電話番号: ${phone}\n初期パスワード: ${initialPassword}`
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>ログイン情報</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">電話番号：</span>
                            <span className="font-mono font-medium">{phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="ml-6 text-sm text-gray-600">初期パスワード：</span>
                            <span className="font-mono font-medium">{initialPassword}</span>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? 'コピーしました' : 'コピー'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
