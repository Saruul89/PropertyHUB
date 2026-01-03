'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useFeature } from '@/hooks';
import {
    LayoutDashboard,
    Building2,
    Users,
    Receipt,
    Gauge,
    Wrench,
    BarChart3,
    Settings,
    LogOut,
    Map,
    FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    feature?: string;
}

const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Хянах самбар', icon: LayoutDashboard },
    { href: '/dashboard/properties', label: 'Барилга', icon: Building2 },
    { href: '/dashboard/floor-plans', label: 'Давхрын зураг', icon: Map, feature: 'floor_plan' },
    { href: '/dashboard/tenants', label: 'Оршин суугчид', icon: Users },
    { href: '/dashboard/leases', label: 'Гэрээ', icon: FileText, feature: 'lease_management' },
    { href: '/dashboard/billings', label: 'Төлбөр нэхэмжлэх', icon: Receipt },
    { href: '/dashboard/meter-readings', label: 'Тоолуур оруулах', icon: Gauge, feature: 'meter_readings' },
    { href: '/dashboard/maintenance', label: 'Засвар үйлчилгээ', icon: Wrench, feature: 'maintenance_basic' },
    { href: '/dashboard/reports', label: 'Тайлан', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Тохиргоо', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();
    const hasMeterReadings = useFeature('meter_readings');
    const hasMaintenanceBasic = useFeature('maintenance_basic');
    const hasFloorPlan = useFeature('floor_plan');
    const hasLeaseManagement = useFeature('lease_management');

    const featureFlags: Record<string, boolean> = {
        meter_readings: hasMeterReadings,
        maintenance_basic: hasMaintenanceBasic,
        floor_plan: hasFloorPlan,
        lease_management: hasLeaseManagement,
    };

    const filteredItems = navItems.filter((item) => {
        if (!item.feature) return true;
        return featureFlags[item.feature];
    });

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        <span className="text-xl font-bold">PropertyHub</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-600'
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
