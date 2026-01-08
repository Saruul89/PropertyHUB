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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  // Prepare data for the main chart
  const summaryData = [
    {
      name: 'Энэ сар',
      'Нийт нэхэмжлэл': totalBilled,
      'Төлөгдсөн': totalPaid,
    },
  ];

  // Prepare fee type breakdown data
  const feeData = feeTypeData.slice(0, 6).map((item) => ({
    name: item.fee_name.length > 15 ? item.fee_name.slice(0, 15) + '...' : item.fee_name,
    fullName: item.fee_name,
    amount: item.total_amount,
    count: item.count,
  }));

  const formatCurrency = (value: number) => `₮${(value / 1000).toFixed(0)}K`;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Нэхэмжлэл ба Төлөлт</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip
                  formatter={(value) => [`₮${Number(value ?? 0).toLocaleString()}`, undefined]}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Bar
                  dataKey="Нийт нэхэмжлэл"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="Төлөгдсөн"
                  fill="#22c55e"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fee Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Төлбөрийн төрлөөр</CardTitle>
        </CardHeader>
        <CardContent>
          {feeData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-gray-500">
              Мэдээлэл байхгүй
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={formatCurrency} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [`₮${Number(value ?? 0).toLocaleString()}`, undefined]}
                    labelFormatter={(_label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return '';
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} name="Дүн" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
