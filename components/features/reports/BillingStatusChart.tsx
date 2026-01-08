'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, PieLabelRenderProps } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BillingStatusChartProps = {
  pendingCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
  cancelledCount: number;
};

const STATUS_CONFIG = {
  pending: { label: 'Хүлээгдэж буй', color: '#f59e0b' },
  partial: { label: 'Хэсэгчлэн', color: '#8b5cf6' },
  paid: { label: 'Төлөгдсөн', color: '#22c55e' },
  overdue: { label: 'Хугацаа хэтэрсэн', color: '#ef4444' },
  cancelled: { label: 'Цуцлагдсан', color: '#6b7280' },
};

export const BillingStatusChart = ({
  pendingCount,
  partialCount,
  paidCount,
  overdueCount,
  cancelledCount,
}: BillingStatusChartProps) => {
  const data = [
    { name: STATUS_CONFIG.pending.label, value: pendingCount, color: STATUS_CONFIG.pending.color },
    { name: STATUS_CONFIG.partial.label, value: partialCount, color: STATUS_CONFIG.partial.color },
    { name: STATUS_CONFIG.paid.label, value: paidCount, color: STATUS_CONFIG.paid.color },
    { name: STATUS_CONFIG.overdue.label, value: overdueCount, color: STATUS_CONFIG.overdue.color },
    { name: STATUS_CONFIG.cancelled.label, value: cancelledCount, color: STATUS_CONFIG.cancelled.color },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Нэхэмжлэлийн төлөв</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-gray-500">
            Нэхэмжлэл байхгүй
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Нэхэмжлэлийн төлөв</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={(props: PieLabelRenderProps) =>
                  `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${value ?? 0} нэхэмжлэл`,
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary stats below chart */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-xs text-gray-500">{item.name}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
