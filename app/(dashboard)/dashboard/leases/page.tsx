'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { getLeaseColumns } from '@/components/features/leases/lease-columns';
import { useAuth } from '@/hooks';
import {
  useLeases,
  useDeleteLease,
  usePropertiesSimple,
  filterLeases,
  getLeaseStats,
} from '@/hooks/queries';
import type { LeaseStatus } from '@/types';
import { TableSkeleton } from '@/components/skeletons';
import {
  Plus,
  Search,
  FileText,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react';

const statusConfig = {
  active: { label: 'Идэвхтэй', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  pending: { label: 'Хүлээгдэж буй', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
  expired: { label: 'Дууссан', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  terminated: { label: 'Цуцалсан', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function LeasesPage() {
  const { companyId } = useAuth();
  const { data: leases = [], isLoading: loading } = useLeases(companyId);
  const { data: properties = [] } = usePropertiesSimple(companyId);
  const deleteLease = useDeleteLease();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  const handleDelete = (leaseId: string) => {
    if (!confirm('Энэ гэрээг устгахдаа итгэлтэй байна уу?')) return;
    deleteLease.mutate(leaseId);
  };

  const columns = useMemo(() => getLeaseColumns({ onDelete: handleDelete }), []);

  const filteredLeases = useMemo(
    () =>
      filterLeases(leases, search, {
        propertyId: propertyFilter,
        status: statusFilter as LeaseStatus | 'all' | 'expiring_soon',
      }),
    [leases, search, statusFilter, propertyFilter]
  );

  const stats = useMemo(() => getLeaseStats(leases), [leases]);
  const hasActiveFilters = propertyFilter !== 'all';
  const clearFilters = () => {
    setPropertyFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      <Header
        title="Гэрээний удирдлага"
        action={
          <Link href="/dashboard/leases/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Шинэ гэрээ
            </Button>
          </Link>
        }
      />
      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Card className="hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
                  <div className="text-sm text-gray-500">Идэвхтэй</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                  <div className="text-sm text-gray-500">Хүлээгдэж буй</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</div>
                  <div className="text-sm text-gray-500">30 хоногт дуусах</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  <XCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.expired}</div>
                  <div className="text-sm text-gray-500">Дууссан</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Түрээслэгч, өрөөний дугаараар хайх..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Бүх барилга" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Бүх барилга</SelectItem>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                  <X className="mr-1 h-4 w-4" />
                  Цэвэрлэх
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['all', 'active', 'pending', 'expiring_soon', 'expired', 'terminated'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={
                  status === 'expiring_soon' && statusFilter !== status
                    ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                    : ''
                }
              >
                {status === 'all'
                  ? 'Бүгд'
                  : status === 'expiring_soon'
                    ? '30 хоногт дуусах'
                    : statusConfig[status as keyof typeof statusConfig].label}
              </Button>
            ))}
            <span className="ml-auto text-sm text-gray-500">
              {filteredLeases.length} / {leases.length} гэрээ
            </span>
          </div>
        </div>

        {/* Lease Table */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : filteredLeases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-500">
                {search || statusFilter !== 'all' ? 'Нөхцөлд тохирох гэрээ олдсонгүй' : 'Гэрээ байхгүй'}
              </p>
              {!search && statusFilter === 'all' && (
                <Link href="/dashboard/leases/new">
                  <Button>Шинэ гэрээ үүсгэх</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <DataTable columns={columns} data={filteredLeases} pageSize={20} />
        )}
      </div>
    </>
  );
}
