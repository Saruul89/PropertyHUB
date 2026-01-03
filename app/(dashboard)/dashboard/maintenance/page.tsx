'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { MaintenanceRequest, Unit, Property, Tenant } from '@/types';
import { useFeature } from '@/hooks';
import {
    Plus,
    Search,
    Wrench,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    Building2,
    DollarSign,
    User,
    Phone,
} from 'lucide-react';

interface MaintenanceWithRelations extends MaintenanceRequest {
    unit: Unit & { property: Property };
    tenant?: Tenant;
}

const statusConfig = {
    pending: { label: 'Хүлээгдэж буй', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    in_progress: { label: 'Хийгдэж буй', icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: 'Дууссан', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    cancelled: { label: 'Цуцалсан', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
};

const priorityConfig = {
    low: { label: 'Бага', color: 'bg-gray-100 text-gray-700' },
    normal: { label: 'Дунд', color: 'bg-blue-100 text-blue-700' },
    high: { label: 'Өндөр', color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'Яаралтай', color: 'bg-red-100 text-red-700' },
};

export default function MaintenancePage() {
    const router = useRouter();
    const hasMaintenanceVendor = useFeature('maintenance_vendor');
    const [requests, setRequests] = useState<MaintenanceWithRelations[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<MaintenanceWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        let filtered = requests;

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (req) =>
                    req.title.toLowerCase().includes(searchLower) ||
                    req.unit.unit_number.toLowerCase().includes(searchLower) ||
                    req.unit.property.name.toLowerCase().includes(searchLower) ||
                    (req.vendor_name && req.vendor_name.toLowerCase().includes(searchLower))
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((req) => req.status === statusFilter);
        }

        setFilteredRequests(filtered);
    }, [search, statusFilter, requests]);

    const fetchRequests = async () => {
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
            .from('maintenance_requests')
            .select(`
                *,
                unit:units(*, property:properties(*)),
                tenant:tenants(*)
            `)
            .eq('company_id', companyUser.company_id)
            .order('created_at', { ascending: false });

        setRequests((data as MaintenanceWithRelations[]) || []);
        setFilteredRequests((data as MaintenanceWithRelations[]) || []);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('mn-MN');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('mn-MN').format(amount);
    };

    // Calculate stats
    const stats = {
        pending: requests.filter((r) => r.status === 'pending').length,
        inProgress: requests.filter((r) => r.status === 'in_progress').length,
        completed: requests.filter((r) => r.status === 'completed').length,
        totalCost: requests
            .filter((r) => r.status === 'completed')
            .reduce((sum, r) => sum + (r.actual_cost || 0), 0),
    };

    if (loading) {
        return (
            <>
                <Header title="Засвар үйлчилгээ" />
                <div className="flex h-64 items-center justify-center">
                    <div className="text-gray-500">Ачааллаж байна...</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header
                title="Засвар үйлчилгээ"
                action={
                    <Button onClick={() => router.push('/dashboard/maintenance/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Шинэ хүсэлт
                    </Button>
                }
            />
            <div className="p-6">
                {/* Filters */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Гарчиг, өрөө, барилга, гүйцэтгэгчээр хайх..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                            >
                                {status === 'all'
                                    ? 'Бүгд'
                                    : statusConfig[status as keyof typeof statusConfig].label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-6 grid gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                            <div className="text-sm text-gray-500">Хүлээгдэж буй</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                            <div className="text-sm text-gray-500">Хийгдэж буй</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-4">
                            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                            <div className="text-sm text-gray-500">Дууссан</div>
                        </CardContent>
                    </Card>
                    {hasMaintenanceVendor && (
                        <Card>
                            <CardContent className="pt-4">
                                <div className="text-2xl font-bold text-gray-600">
                                    ₮{formatCurrency(stats.totalCost)}
                                </div>
                                <div className="text-sm text-gray-500">Нийт зардал</div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Request List */}
                {filteredRequests.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Wrench className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-500">
                                {search || statusFilter !== 'all'
                                    ? 'Нөхцөлд тохирох хүсэлт олдсонгүй'
                                    : 'Засварын хүсэлт байхгүй'}
                            </p>
                            {!search && statusFilter === 'all' && (
                                <Button onClick={() => router.push('/dashboard/maintenance/new')}>
                                    Шинэ хүсэлт үүсгэх
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredRequests.map((request) => {
                            const status = statusConfig[request.status];
                            const priority = priorityConfig[request.priority];
                            const StatusIcon = status.icon;

                            return (
                                <Link
                                    key={request.id}
                                    href={`/dashboard/maintenance/${request.id}`}
                                >
                                    <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`rounded-full p-2 ${status.bg}`}>
                                                            <StatusIcon
                                                                className={`h-4 w-4 ${status.color}`}
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold">
                                                                    {request.title}
                                                                </h3>
                                                                <span
                                                                    className={`rounded px-2 py-0.5 text-xs font-medium ${priority.color}`}
                                                                >
                                                                    {priority.label}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Building2 className="h-3 w-3" />
                                                                    {request.unit.property.name} -{' '}
                                                                    {request.unit.unit_number}
                                                                </span>
                                                                {request.category && (
                                                                    <span className="text-gray-400">
                                                                        {request.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {request.description && (
                                                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                                                            {request.description}
                                                        </p>
                                                    )}

                                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                                        {request.tenant && (
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <User className="h-3 w-3" />
                                                                {request.tenant.name}
                                                            </span>
                                                        )}
                                                        {hasMaintenanceVendor && request.vendor_name && (
                                                            <span className="flex items-center gap-1 text-gray-500">
                                                                <Wrench className="h-3 w-3" />
                                                                {request.vendor_name}
                                                            </span>
                                                        )}
                                                        {hasMaintenanceVendor &&
                                                            (request.estimated_cost ||
                                                                request.actual_cost) && (
                                                                <span className="flex items-center gap-1 text-gray-500">
                                                                    <DollarSign className="h-3 w-3" />
                                                                    {request.actual_cost
                                                                        ? `₮${formatCurrency(request.actual_cost)}`
                                                                        : request.estimated_cost
                                                                        ? `Тооцоо: ₮${formatCurrency(request.estimated_cost)}`
                                                                        : ''}
                                                                </span>
                                                            )}
                                                        {request.scheduled_date && (
                                                            <span className="text-gray-500">
                                                                Товлосон: {formatDate(request.scheduled_date)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="ml-4 text-right">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                                                    >
                                                        {status.label}
                                                    </span>
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        {formatDate(request.created_at)}
                                                    </div>
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
