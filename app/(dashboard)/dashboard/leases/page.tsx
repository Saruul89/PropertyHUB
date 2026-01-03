'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Lease, Tenant, Unit, Property } from '@/types';
import {
    Plus,
    Search,
    FileText,
    Calendar,
    Building2,
    User,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
} from 'lucide-react';

interface LeaseWithRelations extends Lease {
    tenant: Tenant;
    unit: Unit & { property: Property };
}

const statusConfig = {
    active: { label: 'Идэвхтэй', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    pending: { label: 'Хүлээгдэж буй', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    expired: { label: 'Дууссан', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
    terminated: { label: 'Цуцалсан', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function LeasesPage() {
    const router = useRouter();
    const [leases, setLeases] = useState<LeaseWithRelations[]>([]);
    const [filteredLeases, setFilteredLeases] = useState<LeaseWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchLeases();
    }, []);

    useEffect(() => {
        let filtered = leases;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (lease) =>
                    lease.tenant.name.toLowerCase().includes(searchLower) ||
                    lease.unit.unit_number.toLowerCase().includes(searchLower) ||
                    lease.unit.property.name.toLowerCase().includes(searchLower)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((lease) => lease.status === statusFilter);
        }

        setFilteredLeases(filtered);
    }, [search, statusFilter, leases]);

    const fetchLeases = async () => {
        const supabase = createClient();
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: companyUser } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', user.user.id)
            .single();

        if (!companyUser) return;

        const { data } = await supabase
            .from('leases')
            .select(`
                *,
                tenant:tenants(*),
                unit:units(*, property:properties(*))
            `)
            .eq('company_id', companyUser.company_id)
            .order('created_at', { ascending: false });

        setLeases((data as LeaseWithRelations[]) || []);
        setFilteredLeases((data as LeaseWithRelations[]) || []);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('mn-MN');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('mn-MN').format(amount);
    };

    const getDaysUntilExpiry = (endDate: string | undefined) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const today = new Date();
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) {
        return (
            <>
                <Header title="Гэрээний удирдлага" />
                <div className="flex h-64 items-center justify-center">
                    <div className="text-gray-500">Ачааллаж байна...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title="Гэрээний удирдлага"
                action={
                    <Button onClick={() => router.push('/dashboard/leases/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Шинэ гэрээ
                    </Button>
                }
            />
            <div className="p-6">
                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Оршин суугч, өрөөний дугаар, барилгын нэрээр хайх..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'active', 'pending', 'expired', 'terminated'].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === 'all' ? 'Бүгд' : statusConfig[status as keyof typeof statusConfig].label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">
                                {leases.filter((l) => l.status === 'active').length}
                            </div>
                            <div className="text-sm text-gray-500">Идэвхтэй</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-600">
                                {leases.filter((l) => l.status === 'pending').length}
                            </div>
                            <div className="text-sm text-gray-500">Хүлээгдэж буй</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-orange-600">
                                {leases.filter((l) => {
                                    const days = getDaysUntilExpiry(l.end_date);
                                    return days !== null && days <= 30 && days > 0 && l.status === 'active';
                                }).length}
                            </div>
                            <div className="text-sm text-gray-500">30 хоногт дуусах</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-gray-600">
                                {leases.filter((l) => l.status === 'expired' || l.status === 'terminated').length}
                            </div>
                            <div className="text-sm text-gray-500">Дууссан</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Lease List */}
                {filteredLeases.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-500">
                                {search || statusFilter !== 'all'
                                    ? 'Нөхцөлд тохирох гэрээ олдсонгүй'
                                    : 'Гэрээ байхгүй'}
                            </p>
                            {!search && statusFilter === 'all' && (
                                <Button onClick={() => router.push('/dashboard/leases/new')}>
                                    Шинэ гэрээ үүсгэх
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredLeases.map((lease) => {
                            const status = statusConfig[lease.status];
                            const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
                            const StatusIcon = status.icon;

                            return (
                                <Link key={lease.id} href={`/dashboard/leases/${lease.id}`}>
                                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-full p-2 ${status.bg}`}>
                                                            <StatusIcon className={`h-4 w-4 ${status.color}`} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold">
                                                                {lease.tenant.name}
                                                            </h3>
                                                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="h-3 w-3" />
                                                                    {lease.unit.property.name} - {lease.unit.unit_number}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                                        <div>
                                                            <div className="text-gray-500">Эхлэх огноо</div>
                                                            <div className="font-medium">
                                                                {formatDate(lease.start_date)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">Дуусах огноо</div>
                                                            <div className="font-medium">
                                                                {lease.end_date
                                                                    ? formatDate(lease.end_date)
                                                                    : 'Хугацаагүй'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">Сарын түрээс</div>
                                                            <div className="font-medium">
                                                                ₮{formatCurrency(lease.monthly_rent)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">Барьцаа</div>
                                                            <div className="font-medium">
                                                                ₮{formatCurrency(lease.deposit)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="ml-4 text-right">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                    {daysUntilExpiry !== null &&
                                                        daysUntilExpiry <= 30 &&
                                                        daysUntilExpiry > 0 &&
                                                        lease.status === 'active' && (
                                                            <div className="mt-2 text-xs text-orange-600">
                                                                {daysUntilExpiry} хоногт дуусна
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
