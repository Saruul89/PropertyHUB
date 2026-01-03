'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { Building2, Search, CreditCard, Calendar, Edit2, Check, X } from 'lucide-react';
import type { Company, Subscription } from '@/types';

interface SubscriptionWithCompany extends Subscription {
    company: Company;
}

const planOptions = [
    { value: 'free', label: 'Free', price: 0, maxProperties: 1, maxUnits: 50 },
    { value: 'basic', label: 'Basic', price: 50000, maxProperties: 3, maxUnits: 150 },
    { value: 'standard', label: 'Standard', price: 100000, maxProperties: 10, maxUnits: 500 },
    { value: 'premium', label: 'Premium', price: 200000, maxProperties: -1, maxUnits: -1 },
];

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<SubscriptionWithCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPlan, setFilterPlan] = useState<string>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editPlan, setEditPlan] = useState<string>('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, companies(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscriptions:', error);
            setLoading(false);
            return;
        }

        type SubscriptionData = Subscription & { companies?: Company };

        const subscriptionsWithCompany: SubscriptionWithCompany[] = ((data || []) as SubscriptionData[])
            .filter((s) => s.companies)
            .map((s) => ({
                ...s,
                company: s.companies as Company,
            }));

        setSubscriptions(subscriptionsWithCompany);
        setLoading(false);
    };

    const startEdit = (sub: SubscriptionWithCompany) => {
        setEditingId(sub.id);
        setEditPlan(sub.plan);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPlan('');
    };

    const saveEdit = async (subscriptionId: string) => {
        const supabase = createClient();
        const planConfig = planOptions.find(p => p.value === editPlan);

        if (!planConfig) return;

        const { error } = await supabase
            .from('subscriptions')
            .update({
                plan: editPlan,
                price_per_month: planConfig.price,
                max_properties: planConfig.maxProperties === -1 ? 9999 : planConfig.maxProperties,
                max_units: planConfig.maxUnits === -1 ? 99999 : planConfig.maxUnits,
            })
            .eq('id', subscriptionId);

        if (error) {
            console.error('Error updating subscription:', error);
            alert('Шинэчлэхэд алдаа гарлаа');
        } else {
            await fetchSubscriptions();
            setEditingId(null);
            setEditPlan('');
        }
    };

    const filteredSubscriptions = subscriptions.filter(sub => {
        const matchesSearch = sub.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.company.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlan = filterPlan === 'all' || sub.plan === filterPlan;
        return matchesSearch && matchesPlan;
    });

    const getPlanBadgeColor = (plan: string) => {
        switch (plan) {
            case 'premium': return 'bg-purple-100 text-purple-800';
            case 'standard': return 'bg-blue-100 text-blue-800';
            case 'basic': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'past_due': return 'bg-red-100 text-red-800';
            case 'canceled': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Stats
    const stats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        free: subscriptions.filter(s => s.plan === 'free').length,
        paid: subscriptions.filter(s => s.plan !== 'free').length,
        monthlyRevenue: subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => sum + (s.price_per_month || 0), 0),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Захиалгын удирдлага</h1>
                <p className="text-gray-600">Компаниудын захиалгын багцыг удирдах</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Нийт захиалга</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-gray-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Идэвхтэй</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <Check className="h-8 w-8 text-green-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Төлбөртэй багц</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.paid}</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Сарын орлого</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {stats.monthlyRevenue.toLocaleString()}₮
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
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
                                variant={filterPlan === 'all' ? 'default' : 'outline'}
                                onClick={() => setFilterPlan('all')}
                                size="sm"
                            >
                                Бүгд
                            </Button>
                            {planOptions.map(plan => (
                                <Button
                                    key={plan.value}
                                    variant={filterPlan === plan.value ? 'default' : 'outline'}
                                    onClick={() => setFilterPlan(plan.value)}
                                    size="sm"
                                >
                                    {plan.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Subscriptions List */}
            <Card>
                <CardHeader>
                    <CardTitle>Захиалгын жагсаалт ({filteredSubscriptions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Ачааллаж байна...</div>
                    ) : filteredSubscriptions.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Тохирох захиалга олдсонгүй
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-gray-500">
                                        <th className="pb-3 font-medium">Компани</th>
                                        <th className="pb-3 font-medium">Багц</th>
                                        <th className="pb-3 font-medium">Сарын төлбөр</th>
                                        <th className="pb-3 font-medium">Хязгаар</th>
                                        <th className="pb-3 font-medium">Төлөв</th>
                                        <th className="pb-3 font-medium">Үйлдэл</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredSubscriptions.map((sub) => (
                                        <tr key={sub.id} className="text-sm">
                                            <td className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Building2 className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{sub.company.name}</p>
                                                        <p className="text-gray-500">{sub.company.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                {editingId === sub.id ? (
                                                    <select
                                                        value={editPlan}
                                                        onChange={(e) => setEditPlan(e.target.value)}
                                                        className="border rounded px-2 py-1"
                                                    >
                                                        {planOptions.map(plan => (
                                                            <option key={plan.value} value={plan.value}>
                                                                {plan.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(sub.plan)}`}>
                                                        {sub.plan}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                {(sub.price_per_month || 0).toLocaleString()}₮
                                            </td>
                                            <td className="py-4 text-gray-500">
                                                <div className="text-xs">
                                                    <p>Барилга: {sub.max_properties === 9999 ? 'Хязгааргүй' : sub.max_properties}</p>
                                                    <p>Өрөө: {sub.max_units === 99999 ? 'Хязгааргүй' : sub.max_units}</p>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(sub.status)}`}>
                                                    {sub.status === 'active' ? 'Идэвхтэй' :
                                                     sub.status === 'past_due' ? 'Хугацаа хэтэрсэн' :
                                                     sub.status === 'canceled' ? 'Цуцалсан' : sub.status}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                {editingId === sub.id ? (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => saveEdit(sub.id)}>
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(sub)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
