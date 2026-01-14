'use client';

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import type { TenantWithLease } from '@/hooks/queries';
import { Users, Phone, Home, Eye, Trash2 } from 'lucide-react';

type TenantColumnsProps = {
  onDelete: (id: string) => void;
};

export function getTenantColumns({ onDelete }: TenantColumnsProps): ColumnDef<TenantWithLease>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Оршин суугч" />,
      cell: ({ row }) => {
        const tenant = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-700 shadow-md shadow-slate-500/20">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{tenant.name}</p>
              {tenant.tenant_type === 'company' && (
                <p className="text-sm text-gray-500">{tenant.company_name}</p>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'phone',
      header: 'Утас',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="h-4 w-4 text-gray-400" />
          {row.original.phone}
        </div>
      ),
    },
    {
      id: 'unit',
      header: 'Өрөө',
      cell: ({ row }) => {
        const tenant = row.original;
        if (tenant.lease?.unit) {
          return (
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-emerald-500" />
              <div>
                <span className="font-medium text-gray-900">{tenant.lease.unit.unit_number}</span>
                {tenant.lease.unit.property && (
                  <p className="text-xs text-gray-500">{tenant.lease.unit.property.name}</p>
                )}
              </div>
            </div>
          );
        }
        return (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
            Хуваарилаагүй
          </span>
        );
      },
    },
    {
      accessorKey: 'tenant_type',
      header: 'Төрөл',
      cell: ({ row }) => (
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            row.original.tenant_type === 'individual'
              ? 'bg-sky-100 text-sky-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.original.tenant_type === 'individual' ? 'Хувь хүн' : 'Компани'}
        </span>
      ),
    },
    {
      id: 'password',
      header: 'Анхны нууц үг',
      cell: ({ row }) => {
        const tenant = row.original;
        if (tenant.initial_password && !tenant.password_changed) {
          return (
            <code className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-mono text-gray-700">
              {tenant.initial_password}
            </code>
          );
        }
        return (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">
            Солигдсон
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Үйлдэл</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Link href={`/dashboard/tenants/${row.original.id}`}>
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
