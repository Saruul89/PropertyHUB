'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth, useTenant } from '@/hooks';
import { LayoutDashboard, Receipt, Gauge, Settings, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
}

const navItems: NavItem[] = [
    { href: '/tenant/dashboard', label: 'Нүүр', icon: LayoutDashboard },
    { href: '/tenant/billings', label: 'Миний төлбөрүүд', icon: Receipt },
    { href: '/tenant/meter-submit', label: 'Тоолуур бүртгэх', icon: Gauge },
    { href: '/tenant/settings', label: 'Тохиргоо', icon: Settings },
];

export function TenantSidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const { tenant, lease } = useTenant();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/tenant/dashboard" className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-green-600" />
                        <span className="text-xl font-bold">Оршин суугчийн портал</span>
                    </Link>
                </div>

                {/* User Info */}
                {tenant && (
                    <div className="border-b p-4">
                        <p className="font-medium">{tenant.name}</p>
                        {lease && (
                            <p className="text-sm text-gray-500">
                                {(lease as { unit?: { unit_number?: string } }).unit?.unit_number} өрөө
                            </p>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-green-50 text-green-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="border-t p-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-gray-700"
                        onClick={signOut}
                    >
                        <LogOut className="h-5 w-5" />
                        Гарах
                    </Button>
                </div>
            </div>
        </aside>
    );
}
