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
    User,
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
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1a1a2e]">
            {/* Wave decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10 pointer-events-none">
                <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="none">
                    <path
                        d="M0,100 Q50,50 100,100 T200,100"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                    />
                    <path
                        d="M0,120 Q50,70 100,120 T200,120"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                    />
                    <path
                        d="M0,140 Q50,90 100,140 T200,140"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                    />
                </svg>
            </div>

            <div className="relative flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-violet-500" />
                        <span className="text-xl font-bold text-white">PropertyHub</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <User className="h-5 w-5" />
                        </Button>
                        <Link href="/dashboard/settings">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-white/10"
                            >
                                <Settings className="h-5 w-5" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={signOut}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
