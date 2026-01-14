'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { LeaseWithRelations } from '@/hooks/queries';
import { getDaysUntilExpiry } from '@/hooks/queries';
import {
  FileText,
  Building2,
  Calendar,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

type LeaseColumnsProps = {
  onDelete: (id: string) => void;
};

const statusConfig = {
  active: { label: 'Идэвхтэй', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  pending: { label: 'Хүлээгдэж буй', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  expired: { label: 'Дууссан', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  terminated: { label: 'Цуцалсан', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('mn-MN');
const formatCurrency = (amount: number) => `₮${new Intl.NumberFormat('mn-MN').format(amount)}`;

export function getLeaseColumns({ onDelete }: LeaseColumnsProps): ColumnDef<LeaseWithRelations>[] {
  return [
    {
      accessorKey: 'tenant.name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Түрээслэгч" />,
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-md shadow-slate-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{lease.tenant.name}</p>
              <p className="text-sm text-gray-500">{lease.unit.property.name}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'unit',
      header: 'Өрөө',
      cell: ({ row }) => {
        const lease = row.original;
        return (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-gray-900">{lease.unit.unit_number}</span>
          </div>
        );
      },
    },
    {
      id: 'dates',
      header: 'Хугацаа',
      cell: ({ row }) => {
        const lease = row.original;
        const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
        const isExpiringSoon =
          daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0 && lease.status === 'active';

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>{formatDate(lease.start_date)}</span>
              <span className="text-gray-400">-</span>
              <span>{lease.end_date ? formatDate(lease.end_date) : 'Хугацаагүй'}</span>
            </div>
            {isExpiringSoon && (
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                <span>{daysUntilExpiry} хоногт дуусна</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'monthly_rent',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Сарын түрээс" />,
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">{formatCurrency(row.original.monthly_rent)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Төлөв',
      cell: ({ row }) => {
        const status = statusConfig[row.original.status];
        const StatusIcon = status.icon;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Үйлдэл</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link href={`/dashboard/leases/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="rounded-full hover:bg-slate-100">
              <Eye className="h-4 w-4 text-gray-500" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row.original.id)}
            className="rounded-full hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
}
