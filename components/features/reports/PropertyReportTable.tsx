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
import { Building2 } from 'lucide-react';
import { ReportExportButton } from './ReportExportButton';

type PropertyStats = {
  property_id: string;
  property_name: string;
  total_billed: number;
  total_paid: number;
  billing_count: number;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
};

type PropertyReportTableProps = {
  data: PropertyStats[];
  month: string;
};

export const PropertyReportTable = ({ data, month }: PropertyReportTableProps) => {
  const exportColumns = [
    { key: 'property_name' as const, header: 'Хөрөнгийн нэр' },
    {
      key: 'total_billed' as const,
      header: 'Нийт нэхэмжлэл',
      formatter: (v: number) => `₮${v.toLocaleString()}`,
    },
    {
      key: 'total_paid' as const,
      header: 'Төлөгдсөн',
      formatter: (v: number) => `₮${v.toLocaleString()}`,
    },
    { key: 'billing_count' as const, header: 'Нэхэмжлэлийн тоо' },
    { key: 'paid_count' as const, header: 'Төлсөн тоо' },
    { key: 'unpaid_count' as const, header: 'Төлөөгүй тоо' },
    { key: 'overdue_count' as const, header: 'Хугацаа хэтэрсэн' },
  ];

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-blue-600" />
            Хөрөнгөөр тайлан
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-gray-500">
            Мэдээлэл байхгүй
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-5 w-5 text-blue-600" />
          Хөрөнгөөр тайлан
        </CardTitle>
        <ReportExportButton
          data={data}
          columns={exportColumns}
          filename={`property-report-${month}`}
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Хөрөнгийн нэр</TableHead>
                <TableHead className="text-right">Нийт нэхэмжлэл</TableHead>
                <TableHead className="text-right">Төлөгдсөн</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
                <TableHead className="text-center">Нэхэмжлэл</TableHead>
                <TableHead className="text-center">Төлсөн</TableHead>
                <TableHead className="text-center">Хэтэрсэн</TableHead>
                <TableHead className="text-right">Цуглуулалт</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((property) => {
                const outstanding = property.total_billed - property.total_paid;
                const collectionRate =
                  property.total_billed > 0
                    ? (property.total_paid / property.total_billed) * 100
                    : 0;

                return (
                  <TableRow key={property.property_id}>
                    <TableCell className="font-medium">
                      {property.property_name}
                    </TableCell>
                    <TableCell className="text-right">
                      ₮{property.total_billed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₮{property.total_paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ₮{outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {property.billing_count}
                    </TableCell>
                    <TableCell className="text-center text-green-600">
                      {property.paid_count}
                    </TableCell>
                    <TableCell className="text-center">
                      {property.overdue_count > 0 ? (
                        <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">
                          {property.overdue_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          collectionRate >= 80
                            ? 'text-green-600'
                            : collectionRate >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }
                      >
                        {collectionRate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary row */}
        <div className="mt-4 flex flex-wrap gap-4 border-t pt-4 text-sm">
          <div>
            <span className="text-gray-500">Нийт нэхэмжлэл: </span>
            <span className="font-semibold">
              ₮{data.reduce((sum, p) => sum + p.total_billed, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Нийт төлөгдсөн: </span>
            <span className="font-semibold text-green-600">
              ₮{data.reduce((sum, p) => sum + p.total_paid, 0).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Нийт үлдэгдэл: </span>
            <span className="font-semibold text-red-600">
              ₮
              {data
                .reduce((sum, p) => sum + (p.total_billed - p.total_paid), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
