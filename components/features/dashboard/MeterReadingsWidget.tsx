'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, ChevronRight } from 'lucide-react';

export const MeterReadingsWidget = () => {
  return (
    <Link href="/dashboard/meter-readings">
      <Card className="cursor-pointer border-l-4 border-l-cyan-500 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
                <Gauge className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Тоолуурын уншилт</p>
                <p className="text-xs text-gray-500">Тоолуур оруулах</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
