'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import { ReportExportButton } from './ReportExportButton';

type OverdueTenant = {
  tenant_name: string;
  unit_number: string;
  property_name: string;
  total_amount: number;
  paid_amount: number;
  outstanding: number;
  due_date: string;
};

type OverdueTenantsTableProps = {
  data: OverdueTenant[];
  month: string;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('mn-MN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getDaysOverdue = (dueDate: string): number => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const OverdueTenantsTable = ({ data, month }: OverdueTenantsTableProps) => {
  const exportColumns = [
    { key: 'tenant_name' as const, header: 'Түрээслэгч' },
    { key: 'unit_number' as const, header: 'Өрөө' },
    { key: 'property_name' as const, header: 'Хөрөнгө' },
    {
      key: 'total_amount' as const,
      header: 'Нийт дүн',
      formatter: (v: number) => `₮${v.toLocaleString()}`,
    },
    {
      key: 'paid_amount' as const,
      header: 'Төлсөн',
      formatter: (v: number) => `₮${v.toLocaleString()}`,
    },
    {
      key: 'outstanding' as const,
      header: 'Үлдэгдэл',
      formatter: (v: number) => `₮${v.toLocaleString()}`,
    },
    { key: 'due_date' as const, header: 'Төлөх хугацаа', formatter: formatDate },
  ];

  const totalOutstanding = data.reduce((sum, t) => sum + t.outstanding, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Хугацаа хэтэрсэн төлбөрүүд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-green-600">
            Хугацаа хэтэрсэн төлбөр байхгүй
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Хугацаа хэтэрсэн төлбөрүүд
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Нийт {data.length} түрээслэгч, ₮{totalOutstanding.toLocaleString()} үлдэгдэлтэй
          </p>
        </div>
        <ReportExportButton
          data={data}
          columns={exportColumns}
          filename={`overdue-report-${month}`}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Түрээслэгч</TableHead>
                <TableHead>Өрөө</TableHead>
                <TableHead>Хөрөнгө</TableHead>
                <TableHead className="text-right">Нийт дүн</TableHead>
                <TableHead className="text-right">Төлсөн</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
                <TableHead className="text-center">Төлөх хугацаа</TableHead>
                <TableHead className="text-center">Хэтэрсэн хоног</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tenant, index) => {
                const daysOverdue = getDaysOverdue(tenant.due_date);

                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                    <TableCell>{tenant.unit_number}</TableCell>
                    <TableCell className="text-gray-600">{tenant.property_name}</TableCell>
                    <TableCell className="text-right">
                      ₮{tenant.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₮{tenant.paid_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      ₮{tenant.outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(tenant.due_date)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-sm font-medium ${
                          daysOverdue > 30
                            ? 'bg-red-100 text-red-800'
                            : daysOverdue > 14
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {daysOverdue} хоног
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
