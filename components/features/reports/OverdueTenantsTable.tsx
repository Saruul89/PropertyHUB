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
import { AlertCircle, Search, User, Building2, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
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

const getOverdueColor = (days: number): { bg: string; text: string; border: string } => {
  if (days > 30) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  if (days > 14) return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
  return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
};

export const OverdueTenantsTable = ({ data, month }: OverdueTenantsTableProps) => {
  const [search, setSearch] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

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

  const filteredData = data.filter(
    (tenant) =>
      tenant.tenant_name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      tenant.property_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filteredData.reduce((sum, t) => sum + t.outstanding, 0);

  const toggleCard = (index: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-green-600" />
            Хугацаа хэтэрсэн төлбөрүүд
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-green-100 p-3">
              <AlertCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-medium text-green-600">Хугацаа хэтэрсэн төлбөр байхгүй</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Бүх төлбөр хугацаандаа төлөгдсөн байна
            </p>
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
              <AlertCircle className="h-4 w-4 text-red-600" />
              Хугацаа хэтэрсэн төлбөрүүд
            </CardTitle>
            <CardDescription className="mt-1">
              Нийт {filteredData.length} түрээслэгч, ₮{totalOutstanding.toLocaleString()} үлдэгдэлтэй
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
              filename={`overdue-report-${month}`}
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
                <TableHead>Түрээслэгч</TableHead>
                <TableHead>Өрөө</TableHead>
                <TableHead>Хөрөнгө</TableHead>
                <TableHead className="text-right">Нийт дүн</TableHead>
                <TableHead className="text-right">Төлсөн</TableHead>
                <TableHead className="text-right">Үлдэгдэл</TableHead>
                <TableHead className="text-center">Хугацаа</TableHead>
                <TableHead className="text-center">Хэтэрсэн</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((tenant, index) => {
                const daysOverdue = getDaysOverdue(tenant.due_date);
                const colors = getOverdueColor(daysOverdue);

                return (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                    <TableCell>{tenant.unit_number}</TableCell>
                    <TableCell className="text-muted-foreground">{tenant.property_name}</TableCell>
                    <TableCell className="text-right">
                      ₮{tenant.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ₮{tenant.paid_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      ₮{tenant.outstanding.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {formatDate(tenant.due_date)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
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

        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filteredData.map((tenant, index) => {
            const daysOverdue = getDaysOverdue(tenant.due_date);
            const colors = getOverdueColor(daysOverdue);
            const isExpanded = expandedCards.has(index);

            return (
              <div
                key={index}
                className={`rounded-lg border ${colors.border} ${colors.bg} overflow-hidden`}
              >
                <button
                  onClick={() => toggleCard(index)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-white p-2">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{tenant.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tenant.unit_number} • {tenant.property_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        ₮{tenant.outstanding.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.text}`}
                      >
                        {daysOverdue} хоног
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
                  <div className="border-t bg-white/50 p-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Нийт дүн</p>
                        <p className="font-medium">₮{tenant.total_amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Төлсөн</p>
                        <p className="font-medium text-green-600">
                          ₮{tenant.paid_amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Төлөх хугацаа:</span>
                        <span className="font-medium">{formatDate(tenant.due_date)}</span>
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
      </CardContent>
    </Card>
  );
};
