'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { Tenant, Lease, Unit, Property, TenantType } from '@/types';
import { Plus, Users, Phone, Home, Search, Eye, Trash2, Building2, X } from 'lucide-react';

interface TenantWithLease extends Tenant {
    lease?: (Lease & { unit?: Unit & { property?: Property } }) | null;
}

type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

export default function TenantsPage() {
    const { companyId } = useAuth();
    const [tenants, setTenants] = useState<TenantWithLease[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [propertyFilter, setPropertyFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<TenantType | 'all'>('all');
    const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');

    useEffect(() => {
        if (companyId) {
            fetchData();
        }
    }, [companyId]);

    const fetchData = async () => {
        const supabase = createClient();

        // Fetch properties and tenants in parallel
        const [propertiesResult, tenantsResult] = await Promise.all([
            supabase
                .from('properties')
                .select('id, name')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('name'),
            supabase
                .from('tenants')
                .select(`
                    *,
                    leases(*, units(*, properties(id, name)))
                `)
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('created_at', { ascending: false }),
        ]);

        if (propertiesResult.data) {
            setProperties(propertiesResult.data as Property[]);
        }

        if (tenantsResult.error || !tenantsResult.data) {
            setLoading(false);
            return;
        }

        // Transform data to match TenantWithLease interface
        type UnitWithProperty = Unit & { properties: Property };
        type TenantWithLeases = Tenant & { leases?: Array<Lease & { units: UnitWithProperty }> };
        const tenantsWithLeases: TenantWithLease[] = (tenantsResult.data as TenantWithLeases[]).map((tenant) => {
            const leases = tenant.leases;
            const activeLease = leases?.find((l) => l.status === 'active');

            return {
                ...tenant,
                leases: undefined,
                lease: activeLease
                    ? {
                          ...activeLease,
                          unit: {
                              ...activeLease.units,
                              property: activeLease.units.properties,
                          },
                      }
                    : null,
            } as TenantWithLease;
        });

        setTenants(tenantsWithLeases);
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Энэ оршин суугчийг устгахдаа итгэлтэй байна уу?')) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('tenants')
            .update({ is_active: false })
            .eq('id', id);

        if (!error) {
            setTenants(tenants.filter((t) => t.id !== id));
        }
    };

    const filteredTenants = tenants.filter((tenant) => {
        // Search filter
        const matchesSearch =
            search === '' ||
            tenant.name.toLowerCase().includes(search.toLowerCase()) ||
            tenant.phone.includes(search);

        // Property filter
        const matchesProperty =
            propertyFilter === 'all' ||
            tenant.lease?.unit?.property?.id === propertyFilter;

        // Type filter
        const matchesType = typeFilter === 'all' || tenant.tenant_type === typeFilter;

        // Assignment filter
        const matchesAssignment =
            assignmentFilter === 'all' ||
            (assignmentFilter === 'assigned' && tenant.lease?.unit) ||
            (assignmentFilter === 'unassigned' && !tenant.lease?.unit);

        return matchesSearch && matchesProperty && matchesType && matchesAssignment;
    });

    const hasActiveFilters =
        propertyFilter !== 'all' || typeFilter !== 'all' || assignmentFilter !== 'all';

    const clearFilters = () => {
        setPropertyFilter('all');
        setTypeFilter('all');
        setAssignmentFilter('all');
    };

    return (
        <>
            <Header title="Оршин суугчид" />
            <div className="p-6">
                {/* Search and Add Button */}
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Нэр, утасны дугаараар хайх..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Link href="/dashboard/tenants/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Оршин суугч нэмэх
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
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
                    </div>

                    <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TenantType | 'all')}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Бүх төрөл" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Бүх төрөл</SelectItem>
                            <SelectItem value="individual">Хувь хүн</SelectItem>
                            <SelectItem value="company">Компани</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={assignmentFilter} onValueChange={(v) => setAssignmentFilter(v as AssignmentFilter)}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Бүх төлөв" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Бүгд</SelectItem>
                            <SelectItem value="assigned">Өрөөтэй</SelectItem>
                            <SelectItem value="unassigned">Өрөөгүй</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500">
                            <X className="mr-1 h-4 w-4" />
                            Цэвэрлэх
                        </Button>
                    )}

                    <span className="ml-auto text-sm text-gray-500">
                        {filteredTenants.length} / {tenants.length} оршин суугч
                    </span>
                </div>

                {loading ? (
                    <div className="text-center text-gray-500">Ачааллаж байна...</div>
                ) : filteredTenants.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Users className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-600">
                                {search ? 'Хайлтад тохирох оршин суугч олдсонгүй' : 'Оршин суугч бүртгэгдээгүй байна'}
                            </p>
                            {!search && (
                                <Link href="/dashboard/tenants/new">
                                    <Button>Эхний оршин суугч бүртгэх</Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Оршин суугч
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Утас
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Өрөө
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Төрөл
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                                        Анхны нууц үг
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                        Үйлдэл
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredTenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                    <Users className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{tenant.name}</p>
                                                    {tenant.tenant_type === 'company' && (
                                                        <p className="text-sm text-gray-500">
                                                            {tenant.company_name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="h-4 w-4" />
                                                {tenant.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.lease?.unit ? (
                                                <div className="flex items-center gap-2">
                                                    <Home className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <span className="font-medium">{tenant.lease.unit.unit_number}</span>
                                                        {tenant.lease.unit.property && (
                                                            <p className="text-xs text-gray-500">
                                                                {tenant.lease.unit.property.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Хуваарилаагүй</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    tenant.tenant_type === 'individual'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}
                                            >
                                                {tenant.tenant_type === 'individual'
                                                    ? 'Хувь хүн'
                                                    : 'Компани'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tenant.initial_password && !tenant.password_changed ? (
                                                <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                                                    {tenant.initial_password}
                                                </code>
                                            ) : (
                                                <span className="text-gray-400">Солигдсон</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/tenants/${tenant.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(tenant.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
