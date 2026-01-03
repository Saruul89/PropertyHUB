'use client';

import { BillingStatus } from '@/types';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface BillingStatusBadgeProps {
    status: BillingStatus;
    dueDate?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<BillingStatus, { label: string; color: string; icon: React.ElementType }> = {
    pending: { label: '未払い', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    partial: { label: '一部支払済', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
    paid: { label: '支払済', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    overdue: { label: '延滞', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export function BillingStatusBadge({
    status,
    dueDate,
    showIcon = true,
    size = 'md',
}: BillingStatusBadgeProps) {
    // Check if overdue based on due date
    const isOverdue =
        status === 'pending' &&
        dueDate &&
        new Date(dueDate) < new Date();

    const displayStatus = isOverdue ? 'overdue' : status;
    const config = statusConfig[displayStatus];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-1.5 py-0.5 text-xs',
        md: 'px-2 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base',
    };

    const iconSizes = {
        sm: 'h-3 w-3',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
    };

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
        >
            {showIcon && <Icon className={iconSizes[size]} />}
            {config.label}
        </span>
    );
}
