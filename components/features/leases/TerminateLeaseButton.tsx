'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface TerminateLeaseButtonProps {
    leaseId: string;
    onTerminate: () => Promise<void>;
    hasUnpaidBillings?: boolean;
}

export function TerminateLeaseButton({
    leaseId,
    onTerminate,
    hasUnpaidBillings,
}: TerminateLeaseButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleTerminate = async () => {
        let message = 'この契約を終了し、退去処理を行いますか？';
        if (hasUnpaidBillings) {
            message = '未払い請求があります。\n\nこの契約を終了し、退去処理を行いますか？';
        }

        if (!confirm(message)) return;

        setLoading(true);
        try {
            await onTerminate();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleTerminate}
            disabled={loading}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
            <LogOut className="mr-2 h-4 w-4" />
            {loading ? '処理中...' : '退去処理'}
        </Button>
    );
}
