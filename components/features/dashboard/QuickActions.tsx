'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Users, Home, FileText, Wrench } from 'lucide-react';
import { useFeature } from '@/hooks';

export const QuickActions = () => {
  const hasMaintenanceBasic = useFeature('maintenance_basic');

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Түргэн үйлдлүүд</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/properties/new">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-500/30">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Барилга нэмэх</h3>
                <p className="text-xs text-gray-500">Шинэ барилга бүртгэх</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tenants/new">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Түрээслэгч нэмэх</h3>
                <p className="text-xs text-gray-500">Шинэ түрээслэгч</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billings">
          <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Нэхэмжлэл</h3>
                <p className="text-xs text-gray-500">Төлбөр удирдах</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {hasMaintenanceBasic && (
          <Link href="/dashboard/maintenance">
            <Card className="cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Засварын хүсэлт</h3>
                  <p className="text-xs text-gray-500">Засвар удирдах</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
};
