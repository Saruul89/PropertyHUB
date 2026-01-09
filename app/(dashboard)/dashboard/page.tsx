'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/dashboard/properties">
                        <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                                        <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Үл хөдлөх хөрөнгө</p>
                                        <p className="text-2xl font-bold">
                                            {loading ? '-' : stats.propertyCount}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                                    <Home className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Өрөөний тоо</p>
                                    <p className="text-2xl font-bold">
                                        {loading ? '-' : stats.unitCount}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Сул өрөө {stats.vacantCount}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Link href="/dashboard/tenants">
                        <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                                        <Users className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Түрээслэгчид</p>
                                        <p className="text-2xl font-bold">
                                            {loading ? '-' : stats.tenantCount}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="bg-[#1a1a2e] text-white transition-all hover:shadow-lg hover:-translate-y-1">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                                    <TrendingUp className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-300">Эзэмшлийн хувь</p>
                                    <p className="text-2xl font-bold">
                                        {loading || stats.unitCount === 0
                                            ? '-'
                                            : `${Math.round(((stats.unitCount - stats.vacantCount) / stats.unitCount) * 100)}%`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Түргэн үйлдлүүд */}
                <div className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Түргэн үйлдлүүд</h2>
                    <div className="grid gap-6 md:grid-cols-3">
                        <Link href="/dashboard/properties/new">
                            <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600">
                                        <Building2 className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Хөрөнгө нэмэх</h3>
                                        <p className="text-sm text-gray-500">
                                            Шинэ хөрөнгө бүртгэх
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/tenants/new">
                            <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-600">
                                        <Users className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Түрээслэгч нэмэх</h3>
                                        <p className="text-sm text-gray-500">
                                            Шинэ түрээслэгч бүртгэх
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/properties">
                            <Card className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                                <CardContent className="flex items-center gap-4 p-6">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500">
                                        <Home className="h-7 w-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Өрөө удирдах</h3>
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
