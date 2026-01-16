'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  BarChart3,
  Home,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

// All navigation items for experience mode (shows limited but key pages)
const navItems: NavItem[] = [
  { href: '/experience', label: 'Хянах самбар', icon: LayoutDashboard },
  { href: '/experience/properties', label: 'Барилга', icon: Building2 },
  { href: '/experience/tenants', label: 'Оршин суугчид', icon: Users },
  { href: '/experience/billings', label: 'Төлбөр нэхэмжлэх', icon: Receipt },
  { href: '/experience/reports', label: 'Тайлан', icon: BarChart3 },
];

export function ExperienceSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0f172a]">
      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10 pointer-events-none overflow-hidden">
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
          <path
            d="M0,160 Q50,110 100,160 T200,160"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      <div className="relative flex h-full flex-col">
        {/* Logo with Demo badge */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <Link href="/experience" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">PropertyHub</span>
          </Link>
        </div>

        {/* Demo Badge */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Туршилтын горим</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/experience'
              ? pathname === '/experience'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer - Home button instead of logout */}
        <div className="border-t border-white/10 p-4 space-y-3">
          {/* Register CTA */}
          <Link href="/register">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
            >
              Бүртгүүлэх
            </Button>
          </Link>

          {/* Back to Home */}
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Нүүр хуудас руу
            </Button>
          </Link>
        </div>
      </div>
    </aside>
  );
}
