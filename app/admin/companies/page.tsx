'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Building2, Search, ChevronRight, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { AdminCompaniesSkeleton } from '@/components/skeletons';
import Link from 'next/link';
import type { Company, Subscription } from '@/types';

interface CompanyWithStats extends Company {
    subscription?: Subscription;
    property_count: number;
    tenant_count: number;
}

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'apartment' | 'office'>('all');

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        const supabase = createClient();

        const { data: companiesData, error } = await supabase
            .from('companies')
            .select(`
                *,
                subscriptions(*),
                properties(id),
                tenants(id)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching companies:', error);
            setLoading(false);
            return;
        }

        type CompanyData = Company & {
            subscriptions?: Subscription[];
            properties?: { id: string }[];
            tenants?: { id: string }[];
        };

        const companiesWithStats: CompanyWithStats[] = (companiesData as CompanyData[] || []).map((c) => ({
            ...c,
            subscription: c.subscriptions?.[0],
            property_count: c.properties?.length || 0,
            tenant_count: c.tenants?.length || 0,
        }));

        setCompanies(companiesWithStats);
        setLoading(false);
    };

    const toggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('companies')
            .update({ is_active: !currentStatus })
            .eq('id', companyId);

        if (!error) {
            setCompanies(prev => prev.map(c =>
                c.id === companyId ? { ...c, is_active: !currentStatus } : c
            ));
        }
    };

    const filteredCompanies = companies.filter(company => {
        const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            company.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || company.company_type === filterType;
        return matchesSearch && matchesType;
    });

    const getPlanBadgeColor = (plan?: string) => {
        switch (plan) {
            case 'premium': return 'bg-purple-100 text-purple-800';
            case 'standard': return 'bg-blue-100 text-blue-800';
            case 'basic': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Компанийн удирдлага</h1>
                    <p className="text-gray-600">Бүртгэлтэй компаниудын жагсаалт, тохиргоо</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Компанийн нэр, имэйлээр хайх..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={filterType === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterType('all')}
                                size="sm"
                            >
                                Бүгд
                            </Button>
                            <Button
                                variant={filterType === 'apartment' ? 'default' : 'outline'}
                                onClick={() => setFilterType('apartment')}
                                size="sm"
                            >
                                Орон сууц
                            </Button>
                            <Button
                                variant={filterType === 'office' ? 'default' : 'outline'}
                                onClick={() => setFilterType('office')}
                                size="sm"
                            >
                                Оффис
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Companies List */}
            <Card>
                <CardHeader>
                    <CardTitle>Компанийн жагсаалт ({filteredCompanies.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <AdminCompaniesSkeleton />
                    ) : filteredCompanies.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery ? 'Тохирох компани олдсонгүй' : 'Компани бүртгэгдээгүй байна'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredCompanies.map((company) => (
                                <div
                                    key={company.id}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                                                company.is_active ? 'bg-blue-100' : 'bg-gray-200'
                                            }`}>
                                                <Building2 className={`h-6 w-6 ${
                                                    company.is_active ? 'text-blue-600' : 'text-gray-400'
                                                }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className={`font-medium ${!company.is_active ? 'text-gray-400' : ''}`}>
                                                        {company.name}
                                                    </h3>
                                                    {!company.is_active && (
                                                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                                            Идэвхгүй
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{company.email}</p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                                    <span>{company.company_type === 'apartment' ? 'Орон сууц' : 'Оффис'}</span>
                                                    <span>Барилга: {company.property_count}</span>
                                                    <span>Оршин суугч: {company.tenant_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(company.subscription?.plan)}`}>
                                                {company.subscription?.plan || 'free'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                                                className={company.is_active ? 'text-green-600' : 'text-gray-400'}
                                            >
                                                {company.is_active ? (
                                                    <ToggleRight className="h-5 w-5" />
                                                ) : (
                                                    <ToggleLeft className="h-5 w-5" />
                                                )}
                                            </Button>
                                            <Link href={`/admin/companies/${company.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Settings className="h-4 w-4 mr-1" />
                                                    Тохиргоо
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
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
