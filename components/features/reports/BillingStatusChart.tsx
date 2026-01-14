'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChartIcon } from 'lucide-react';

type BillingStatusChartProps = {
  pendingCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
};

const STATUS_CONFIG = {
  pending: { label: 'Хүлээгдэж буй', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  partial: { label: 'Хэсэгчлэн', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  paid: { label: 'Төлөгдсөн', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  overdue: { label: 'Хэтэрсэн', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  cancelled: { label: 'Цуцлагдсан', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
};

export const BillingStatusChart = ({
  pendingCount,
  partialCount,
  paidCount,
  overdueCount,
  cancelledCount,
}: BillingStatusChartProps) => {
  const data = [
    { name: STATUS_CONFIG.paid.label, value: paidCount, color: STATUS_CONFIG.paid.color, config: STATUS_CONFIG.paid },
    { name: STATUS_CONFIG.pending.label, value: pendingCount, color: STATUS_CONFIG.pending.color, config: STATUS_CONFIG.pending },
    { name: STATUS_CONFIG.partial.label, value: partialCount, color: STATUS_CONFIG.partial.color, config: STATUS_CONFIG.partial },
    { name: STATUS_CONFIG.overdue.label, value: overdueCount, color: STATUS_CONFIG.overdue.color, config: STATUS_CONFIG.overdue },
    { name: STATUS_CONFIG.cancelled.label, value: cancelledCount, color: STATUS_CONFIG.cancelled.color, config: STATUS_CONFIG.cancelled },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChartIcon className="h-4 w-4 text-purple-600" />
            Нэхэмжлэлийн төлөв
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center text-center sm:h-56 md:h-64">
            <PieChartIcon className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm text-muted-foreground">
              Нэхэмжлэл байхгүй байна
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4 text-purple-600" />
          Нэхэмжлэлийн төлөв
        </CardTitle>
        <CardDescription>
          Нийт {total} нэхэмжлэл
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          {/* Pie Chart - Hidden on very small screens, shown from sm up */}
          <div className="hidden h-48 w-full sm:block sm:h-56 md:h-64 md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, props) => {
                    const percent = ((Number(value) / total) * 100).toFixed(1);
                    return [`${value} нэхэмжлэл (${percent}%)`, props.payload.name];
                  }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingLeft: '10px' }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status Cards - Full width on mobile, half on desktop */}
          <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 md:w-1/2">
            {data.map((item) => {
              const percent = ((item.value / total) * 100).toFixed(0);
              return (
                <div
                  key={item.name}
                  className={`flex items-center gap-2 rounded-lg border p-2.5 sm:p-3 ${item.config.bgColor} border-transparent`}
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted-foreground">{item.name}</p>
                    <div className="flex items-baseline gap-1">
                      <p className={`text-lg font-bold ${item.config.textColor}`}>
                        {item.value}
                      </p>
                      <p className="text-xs text-muted-foreground">({percent}%)</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar visualization for mobile */}
        <div className="mt-4 sm:hidden">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {data.map((item, index) => {
              const width = (item.value / total) * 100;
              return (
                <div
                  key={index}
                  className="h-full transition-all"
                  style={{
                    width: `${width}%`,
                    backgroundColor: item.color,
                  }}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
