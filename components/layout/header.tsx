'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks';
import { useRouter } from 'next/navigation';
import { Bell, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
    action?: ReactNode;
}

export function Header({ title, showBack, action }: HeaderProps) {
    const { user } = useAuth();
    const router = useRouter();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
            <div className="flex items-center gap-4">
                {showBack && (
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-xl font-semibold text-gray-900">{title || 'Хянах самбар'}</h1>
            </div>

            <div className="flex items-center gap-4">
                {action}

                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {user?.user_metadata?.company_name || user?.email}
                    </span>
                </div>
            </div>
        </header>
    );
}
