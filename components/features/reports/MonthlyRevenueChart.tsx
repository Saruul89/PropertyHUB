'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Receipt } from 'lucide-react';

type FeeTypeData = {
  fee_name: string;
  total_amount: number;
  count: number;
};

type MonthlyRevenueChartProps = {
  feeTypeData: FeeTypeData[];
  totalBilled: number;
  totalPaid: number;
};

export const MonthlyRevenueChart = ({
  feeTypeData,
  totalBilled,
  totalPaid,
}: MonthlyRevenueChartProps) => {
  const summaryData = [
    {
      name: 'Энэ сар',
      'Нийт нэхэмжлэл': totalBilled,
      'Төлөгдсөн': totalPaid,
    },
  ];

  const feeData = feeTypeData.slice(0, 6).map((item) => ({
    name: item.fee_name.length > 12 ? item.fee_name.slice(0, 12) + '...' : item.fee_name,
    fullName: item.fee_name,
    amount: item.total_amount,
    count: item.count,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `₮${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₮${(value / 1000).toFixed(0)}K`;
    return `₮${value}`;
  };

  const collectionPercentage = totalBilled > 0
    ? ((totalPaid / totalBilled) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Нэхэмжлэл ба Төлөлт
              </CardTitle>
              <CardDescription>
                Цуглуулалт: {collectionPercentage}%
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 sm:h-56 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={60}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`₮${Number(value ?? 0).toLocaleString()}`, undefined]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="circle"
                />
                <Bar
                  dataKey="Нийт нэхэмжлэл"
                  fill="#3b82f6"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                />
                <Bar
                  dataKey="Төлөгдсөн"
                  fill="#22c55e"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats below chart for mobile */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 md:hidden">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Нийт</p>
              <p className="text-lg font-semibold text-blue-600">
                ₮{totalBilled.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Төлөгдсөн</p>
              <p className="text-lg font-semibold text-green-600">
                ₮{totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Type Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-indigo-600" />
            Төлбөрийн төрлөөр
          </CardTitle>
          <CardDescription>
            {feeData.length} төрлийн төлбөр
          </CardDescription>
        </CardHeader>
        <CardContent>
          {feeData.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center sm:h-56 md:h-64">
              <Receipt className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm text-muted-foreground">
                Төлбөрийн мэдээлэл байхгүй
              </p>
            </div>
          ) : (
            <>
              <div className="h-48 sm:h-56 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={feeData}
                    layout="vertical"
                    margin={{ left: 0, right: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      tickFormatter={formatCurrency}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={85}
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value) => [`₮${Number(value ?? 0).toLocaleString()}`, 'Дүн']}
                      labelFormatter={(_label, payload) => {
                        if (payload && payload[0]) {
                          const data = payload[0].payload;
                          return `${data.fullName} (${data.count} ширхэг)`;
                        }
                        return '';
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#6366f1"
                      radius={[0, 6, 6, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Mobile-friendly list view */}
              <div className="mt-4 space-y-2 border-t pt-4 md:hidden">
                {feeData.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.fullName}</span>
                    <span className="font-medium">₮{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
