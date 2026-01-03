'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Bell,
    Settings,
    LogOut,
    Shield,
    Users,
    FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks';

const navigation = [
    {
        name: 'Хянах самбар',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        name: 'Компаниуд',
        href: '/admin/companies',
        icon: Building2,
    },
    {
        name: 'Захиалга',
        href: '/admin/subscriptions',
        icon: CreditCard,
    },
    {
        name: 'Админ хэрэглэгчид',
        href: '/admin/admins',
        icon: Users,
    },
    {
        name: 'Мэдэгдэл',
        href: '/admin/notifications',
        icon: Bell,
    },
    {
        name: 'Үйл ажиллагааны лог',
        href: '/admin/logs',
        icon: FileText,
    },
    {
        name: 'Системийн тохиргоо',
        href: '/admin/settings',
        icon: Settings,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { signOut, user } = useAuth();

    return (
        <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-800">
                <Shield className="h-8 w-8 text-red-500" />
                <div>
                    <span className="text-lg font-bold">PropertyHub</span>
                    <p className="text-xs text-gray-400">Систем удирдлага</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* User info and logout */}
            <div className="border-t border-gray-800 p-4">
                <div className="mb-3 text-sm">
                    <p className="text-gray-400">Нэвтэрсэн</p>
                    <p className="truncate text-white">{user?.email}</p>
                </div>
                <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Гарах
                </button>
            </div>
        </div>
    );
}
