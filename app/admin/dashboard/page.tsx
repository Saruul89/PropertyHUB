'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Building2, Users, Home, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import { AdminDashboardSkeleton } from '@/components/skeletons';
import Link from 'next/link';
import type { Company, Subscription } from '@/types';

interface AdminStats {
    companyCount: number;
    totalProperties: number;
    totalTenants: number;
    totalUnits: number;
    activeSubscriptions: number;
    overduePayments: number;
}

interface RecentCompany extends Company {
    subscription?: Subscription;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats>({
        companyCount: 0,
        totalProperties: 0,
        totalTenants: 0,
        totalUnits: 0,
        activeSubscriptions: 0,
        overduePayments: 0,
    });
    const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const supabase = createClient();

        const [companiesRes, propertiesRes, tenantsRes, unitsRes, subscriptionsRes, overdueRes] = await Promise.all([
            supabase.from('companies').select('id', { count: 'exact' }),
            supabase.from('properties').select('id', { count: 'exact' }),
            supabase.from('tenants').select('id', { count: 'exact' }),
            supabase.from('units').select('id', { count: 'exact' }),
            supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
            supabase.from('billings').select('id', { count: 'exact' }).eq('status', 'overdue'),
        ]);

        setStats({
            companyCount: companiesRes.count || 0,
            totalProperties: propertiesRes.count || 0,
            totalTenants: tenantsRes.count || 0,
            totalUnits: unitsRes.count || 0,
            activeSubscriptions: subscriptionsRes.count || 0,
            overduePayments: overdueRes.count || 0,
        });

        // Recent companies
        const { data: companies } = await supabase
            .from('companies')
            .select('*, subscriptions(*)')
            .order('created_at', { ascending: false })
            .limit(5);

        if (companies) {
            setRecentCompanies(companies.map((c: Company & { subscriptions?: Subscription[] }) => ({
                ...c,
                subscription: c.subscriptions?.[0],
            })));
        }

        setLoading(false);
    };

    const statCards = [
        { title: 'Нийт компани', value: stats.companyCount, icon: Building2, color: 'text-blue-600' },
        { title: 'Нийт барилга', value: stats.totalProperties, icon: Home, color: 'text-green-600' },
        { title: 'Нийт өрөө', value: stats.totalUnits, icon: TrendingUp, color: 'text-purple-600' },
        { title: 'Нийт оршин суугч', value: stats.totalTenants, icon: Users, color: 'text-orange-600' },
        { title: 'Идэвхтэй захиалга', value: stats.activeSubscriptions, icon: CreditCard, color: 'text-indigo-600' },
        { title: 'Хугацаа хэтэрсэн', value: stats.overduePayments, icon: AlertCircle, color: 'text-red-600' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Систем удирдлагын хянах самбар</h1>
                <p className="text-gray-600">PropertyHub системийн бүх мэдээлэл</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">
                                {loading ? '-' : stat.value.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Түргэн үйлдлүүд</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    <Link href="/admin/companies">
                        <Button variant="outline">
                            <Building2 className="mr-2 h-4 w-4" />
                            Компаниуд
                        </Button>
                    </Link>
                    <Link href="/admin/subscriptions">
                        <Button variant="outline">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Захиалгын удирдлага
                        </Button>
                    </Link>
                    <Link href="/admin/notifications">
                        <Button variant="outline">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Мэдэгдлийн удирдлага
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Recent Companies */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Сүүлд бүртгэгдсэн компаниуд</CardTitle>
                    <Link href="/admin/companies">
                        <Button variant="ghost" size="sm">Бүгдийг харах</Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <AdminDashboardSkeleton />
                    ) : recentCompanies.length === 0 ? (
                        <div className="text-gray-500">Компани бүртгэгдээгүй байна</div>
                    ) : (
                        <div className="space-y-3">
                            {recentCompanies.map((company) => (
                                <div
                                    key={company.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{company.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {company.company_type === 'apartment' ? 'Орон сууц' : 'Оффис'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            company.subscription?.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                                            company.subscription?.plan === 'standard' ? 'bg-blue-100 text-blue-800' :
                                            company.subscription?.plan === 'basic' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {company.subscription?.plan || 'free'}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(company.created_at).toLocaleDateString('mn-MN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
