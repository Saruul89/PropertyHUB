'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Building2, Search, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
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

const getCollectionRateColor = (rate: number): { text: string; bg: string } => {
  if (rate >= 80) return { text: 'text-green-700', bg: 'bg-green-100' };
  if (rate >= 50) return { text: 'text-amber-700', bg: 'bg-amber-100' };
  return { text: 'text-red-700', bg: 'bg-red-100' };
};

export const PropertyReportTable = ({ data, month }: PropertyReportTableProps) => {
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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

  const filteredData = data.filter((property) =>
    property.property_name.toLowerCase().includes(search.toLowerCase())
  );

  const totals = filteredData.reduce(
    (acc, p) => ({
      billed: acc.billed + p.total_billed,
      paid: acc.paid + p.total_paid,
      billingCount: acc.billingCount + p.billing_count,
      paidCount: acc.paidCount + p.paid_count,
      overdueCount: acc.overdueCount + p.overdue_count,
    }),
    { billed: 0, paid: 0, billingCount: 0, paidCount: 0, overdueCount: 0 }
  );

  const overallRate = totals.billed > 0 ? (totals.paid / totals.billed) * 100 : 0;

  const toggleCard = (propertyId: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-blue-600" />
            Хөрөнгөөр тайлан
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-gray-100 p-3">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-muted-foreground">Хөрөнгийн мэдээлэл байхгүй</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-blue-600" />
              Хөрөнгөөр тайлан
            </CardTitle>
            <CardDescription className="mt-1">
              {filteredData.length} хөрөнгө • Нийт цуглуулалт: {overallRate.toFixed(1)}%
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <ReportExportButton
              data={filteredData}
              columns={exportColumns}
              filename={`property-report-${month}`}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden overflow-x-auto md:block">
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
              {filteredData.map((property) => {
                const outstanding = property.total_billed - property.total_paid;
                const collectionRate =
                  property.total_billed > 0
                    ? (property.total_paid / property.total_billed) * 100
                    : 0;
                const rateColors = getCollectionRateColor(collectionRate);

                return (
                  <TableRow key={property.property_id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{property.property_name}</TableCell>
                    <TableCell className="text-right">
                      ₮{property.total_billed.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₮{property.total_paid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      ₮{outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">{property.billing_count}</TableCell>
                    <TableCell className="text-center text-green-600">
                      {property.paid_count}
                    </TableCell>
                    <TableCell className="text-center">
                      {property.overdue_count > 0 ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {property.overdue_count}
                        </span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rateColors.bg} ${rateColors.text}`}
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

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filteredData.map((property) => {
            const outstanding = property.total_billed - property.total_paid;
            const collectionRate =
              property.total_billed > 0
                ? (property.total_paid / property.total_billed) * 100
                : 0;
            const rateColors = getCollectionRateColor(collectionRate);
            const isExpanded = expandedCards.has(property.property_id);

            return (
              <div
                key={property.property_id}
                className="overflow-hidden rounded-lg border bg-white"
              >
                <button
                  onClick={() => toggleCard(property.property_id)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{property.property_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {property.billing_count} нэхэмжлэл
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium ${rateColors.bg} ${rateColors.text}`}
                      >
                        {collectionRate >= 50 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {collectionRate.toFixed(0)}%
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Нийт нэхэмжлэл</p>
                        <p className="font-medium">₮{property.total_billed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Төлөгдсөн</p>
                        <p className="font-medium text-green-600">
                          ₮{property.total_paid.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Үлдэгдэл</p>
                        <p className="font-medium text-red-600">₮{outstanding.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Хугацаа хэтэрсэн</p>
                        <p className="font-medium">
                          {property.overdue_count > 0 ? (
                            <span className="text-red-600">{property.overdue_count}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Төлөгдсөн: {property.paid_count}</span>
                        <span>Нийт: {property.billing_count}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${collectionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && search && (
          <div className="py-8 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-muted-foreground">"{search}" хайлтад тохирох үр дүн олдсонгүй</p>
          </div>
        )}

        {/* Summary row */}
        <div className="mt-4 flex flex-wrap gap-3 border-t pt-4 text-sm sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Нийт:</span>
            <span className="font-semibold">₮{totals.billed.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Төлөгдсөн:</span>
            <span className="font-semibold text-green-600">₮{totals.paid.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Үлдэгдэл:</span>
            <span className="font-semibold text-red-600">
              ₮{(totals.billed - totals.paid).toLocaleString()}
            </span>
          </div>
          {totals.overdueCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Хэтэрсэн:</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {totals.overdueCount}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
