'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks';
import { Building2, Users, Home, TrendingUp } from 'lucide-react';

interface DashboardStats {
    propertyCount: number;
    unitCount: number;
    vacantCount: number;
    tenantCount: number;
}

export default function DashboardPage() {
    const { companyId } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        propertyCount: 0,
        unitCount: 0,
        vacantCount: 0,
        tenantCount: 0,
    });
    const [loading, setLoading] = useState(true);

    console.log('[DashboardPage] render, companyId:', companyId);

    useEffect(() => {
        console.log('[DashboardPage] useEffect triggered, companyId:', companyId);
        if (!companyId) {
            console.log('[DashboardPage] No companyId, skipping fetch');
            return;
        }

        const fetchStats = async () => {
            const startTime = performance.now();
            console.log('[DashboardPage] fetchStats started');

            try {
                const supabase = createClient();

                // Use RPC function for single optimized query
                console.log('[DashboardPage] Trying RPC...');
                const rpcStart = performance.now();
                const { data, error } = await supabase.rpc('get_dashboard_stats', {
                    p_company_id: companyId,
                });
                console.log(`[DashboardPage] RPC took ${(performance.now() - rpcStart).toFixed(0)}ms, error:`, error);

                if (error) throw error;

                if (data) {
                    setStats({
                        propertyCount: data.property_count ?? 0,
                        unitCount: data.unit_count ?? 0,
                        vacantCount: data.vacant_count ?? 0,
                        tenantCount: data.tenant_count ?? 0,
                    });
                    console.log(`[DashboardPage] DONE with RPC - total ${(performance.now() - startTime).toFixed(0)}ms`);
                }
            } catch (rpcError) {
                console.log('[DashboardPage] RPC failed, using fallback:', rpcError);
                // Fallback to individual queries if RPC not available
                try {
                    const supabase = createClient();
                    const fallbackStart = performance.now();
                    const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
                        supabase
                            .from('properties')
                            .select('id', { count: 'exact' })
                            .eq('company_id', companyId)
                            .eq('is_active', true),
                        supabase
                            .from('units')
                            .select('id, status, properties!inner(company_id)')
                            .eq('properties.company_id', companyId),
                        supabase
                            .from('tenants')
                            .select('id', { count: 'exact' })
                            .eq('company_id', companyId)
                            .eq('is_active', true),
                    ]);
                    console.log(`[DashboardPage] Fallback queries took ${(performance.now() - fallbackStart).toFixed(0)}ms`);

                    const units = unitsRes.data || [];
                    setStats({
                        propertyCount: propertiesRes.count || 0,
                        unitCount: units.length,
                        vacantCount: units.filter((u: { status: string }) => u.status === 'vacant').length,
                        tenantCount: tenantsRes.count || 0,
                    });
                    console.log(`[DashboardPage] DONE with fallback - total ${(performance.now() - startTime).toFixed(0)}ms`);
                } catch (fallbackError) {
                    console.log('[DashboardPage] Fallback also failed:', fallbackError);
                }
            } finally {
                setLoading(false);
                console.log(`[DashboardPage] setLoading(false)`);
            }
        };

        fetchStats();
    }, [companyId]);

    return (
        <>
            <Header title="Хянах самбар" />
            <div className="p-6">
                {/* Статистик карт */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/dashboard/properties">
                        <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Үл хөдлөх хөрөнгө</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : stats.propertyCount}
                                </div>
                                <p className="text-xs text-muted-foreground">Бүртгэгдсэн хөрөнгө</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Өрөөний тоо</CardTitle>
                            <Home className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading ? '-' : stats.unitCount}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Сул өрөө {stats.vacantCount}
                            </p>
                        </CardContent>
                    </Card>

                    <Link href="/dashboard/tenants">
                        <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Түрээслэгчид</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : stats.tenantCount}
                                </div>
                                <p className="text-xs text-muted-foreground">Идэвхтэй түрээслэгч</p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Эзэмшлийн хувь</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {loading || stats.unitCount === 0
                                    ? '-'
                                    : `${Math.round(((stats.unitCount - stats.vacantCount) / stats.unitCount) * 100)}%`}
                            </div>
                            <p className="text-xs text-muted-foreground">Дүүргэлт</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Түргэн үйлдлүүд */}
                <div className="mt-6">
                    <h2 className="mb-4 text-lg font-semibold">Түргэн үйлдлүүд</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Link href="/dashboard/properties/new">
                            <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                        <Building2 className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Хөрөнгө нэмэх</h3>
                                        <p className="text-sm text-gray-500">
                                            Шинэ хөрөнгө бүртгэх
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/tenants/new">
                            <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                        <Users className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Түрээслэгч нэмэх</h3>
                                        <p className="text-sm text-gray-500">
                                            Шинэ түрээслэгч бүртгэх
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/properties">
                            <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                        <Home className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">Өрөө удирдах</h3>
                                        <p className="text-sm text-gray-500">
                                            Хөрөнгийн өрөөг удирдах
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
