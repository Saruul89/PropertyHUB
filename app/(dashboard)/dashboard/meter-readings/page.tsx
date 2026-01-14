'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useAuth, useFeature } from '@/hooks';
import { MeterReading, FeeType, Unit, Property } from '@/types';
import {
    Gauge,
    Search,
    Plus,
    FileSpreadsheet,
    ClipboardCheck,
    Filter,
    Droplets,
    Eye,
    ChevronLeft,
    ChevronRight,
    History,
} from 'lucide-react';
import { MeterReadingsSkeleton } from '@/components/skeletons';

interface MeterReadingWithDetails extends MeterReading {
    fee_type?: FeeType;
    unit?: Unit & { property?: Property };
}

const ITEMS_PER_PAGE = 20;

export default function MeterReadingsPage() {
    const { companyId } = useAuth();
    const hasMeterReadings = useFeature('meter_readings');
    const [meterReadings, setMeterReadings] = useState<MeterReadingWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [pendingSubmissions, setPendingSubmissions] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        if (companyId) {
            fetchMeterReadings();
            fetchPendingSubmissions();
        }
    }, [companyId, selectedMonth, currentPage]);

    // Reset to first page when month changes
    useEffect(() => {
        setCurrentPage(0);
    }, [selectedMonth, search]);

    const fetchMeterReadings = async () => {
        setLoading(true);
        const supabase = createClient();

        const startDate = `${selectedMonth}-01`;
        const endDate = new Date(selectedMonth + '-01');
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        const { data, error, count } = await supabase
            .from('meter_readings')
            .select(`
                *,
                fee_types(*),
                units!inner(*, properties!inner(*))
            `, { count: 'exact' })
            .eq('units.properties.company_id', companyId)
            .gte('reading_date', startDate)
            .lt('reading_date', endDateStr)
            .order('reading_date', { ascending: false })
            .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

        if (!error && data) {
            const readings = data.map((r: Record<string, unknown>) => ({
                ...r,
                fee_type: r.fee_types as FeeType | undefined,
                unit: r.units
                    ? {
                          ...(r.units as Unit),
                          property: (r.units as Record<string, unknown>).properties as Property | undefined,
                      }
                    : undefined,
            })) as MeterReadingWithDetails[];
            setMeterReadings(readings);
            setTotalCount(count ?? 0);
        }
        setLoading(false);
    };

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    const fetchPendingSubmissions = async () => {
        const supabase = createClient();
        const { count } = await supabase
            .from('tenant_meter_submissions')
            .select('*, units!inner(properties!inner(company_id))', { count: 'exact', head: true })
            .eq('status', 'pending')
            .eq('units.properties.company_id', companyId as string);

        setPendingSubmissions(count || 0);
    };

    const filteredReadings = meterReadings.filter((reading) => {
        const matchesSearch =
            reading.unit?.unit_number.toLowerCase().includes(search.toLowerCase()) ||
            reading.unit?.property?.name.toLowerCase().includes(search.toLowerCase()) ||
            reading.fee_type?.name.toLowerCase().includes(search.toLowerCase());

        return matchesSearch;
    });

    const stats = {
        total: meterReadings.length,
        totalConsumption: meterReadings.reduce((sum, r) => sum + r.consumption, 0),
        totalAmount: meterReadings.reduce((sum, r) => sum + r.total_amount, 0),
    };

    if (!hasMeterReadings) {
        return (
            <>
                <Header title="Тоолуур бүртгэл" />
                <div className="p-6">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Gauge className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="text-gray-600">Тоолуурын функц идэвхгүй байна</p>
                            <p className="text-sm text-gray-500">
                                Энэ функцийг идэвхжүүлэхийн тулд админтай холбогдоно уу
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    return (
        <>
            <Header title="Тоолуур бүртгэл" />
            <div className="p-4 md:p-6">
                {/* Stats Cards */}
                <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                    <Gauge className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stats.total}</div>
                                    <p className="text-sm text-gray-500">Энэ сарын бүртгэл</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-cyan-100 p-2">
                                    <Droplets className="h-5 w-5 text-cyan-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        {stats.totalConsumption.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500">Нийт хэрэглээ</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-green-100 p-2">
                                    <Gauge className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">
                                        ₮{stats.totalAmount.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-gray-500">Нийт дүн</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Link href="/dashboard/meter-readings/submissions">
                        <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-yellow-100 p-2">
                                        <ClipboardCheck className="h-5 w-5 text-yellow-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{pendingSubmissions}</div>
                                        <p className="text-sm text-gray-500">Хүлээгдэж буй илгээлт</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Filters and Actions */}
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Өрөөний дугаар, барилгын нэрээр хайх..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Link href="/dashboard/meter-readings/history">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <History className="mr-2 h-4 w-4" />
                                Түүх
                            </Button>
                        </Link>
                        <Link href="/dashboard/meter-readings/submissions">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <ClipboardCheck className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Оршин суугчийн илгээлт</span>
                                <span className="sm:hidden">Илгээлт</span>
                                {pendingSubmissions > 0 && (
                                    <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-xs text-white">
                                        {pendingSubmissions}
                                    </span>
                                )}
                            </Button>
                        </Link>
                        <Link href="/dashboard/meter-readings/bulk">
                            <Button className="w-full sm:w-auto">
                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                Бөөнөөр оруулах
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Meter Readings Table */}
                {loading ? (
                    <MeterReadingsSkeleton />
                ) : filteredReadings.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Gauge className="mb-4 h-12 w-12 text-gray-400" />
                            <p className="mb-4 text-gray-600">
                                {search
                                    ? 'Тохирох тоолуурын бүртгэл олдсонгүй'
                                    : 'Энэ сарын тоолуурын бүртгэл байхгүй'}
                            </p>
                            <Link href="/dashboard/meter-readings/bulk">
                                <Button>Тоолуур бүртгэх</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="overflow-x-auto rounded-lg border bg-white">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                                        Барилга・Өрөө
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                                        Төлбөрийн төрөл
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 md:px-6">
                                        Бүртгэсэн огноо
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                                        Өмнөх
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                                        Одоогийн
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                                        Хэрэглээ
                                    </th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 md:px-6">
                                        Дүн
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredReadings.map((reading) => (
                                    <tr key={reading.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 md:px-6">
                                            <div className="text-sm">
                                                <p className="font-medium">
                                                    {reading.unit?.property?.name}
                                                </p>
                                                <p className="text-gray-500">
                                                    {reading.unit?.unit_number}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 md:px-6">
                                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                                {reading.fee_type?.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 md:px-6">
                                            {new Date(reading.reading_date).toLocaleDateString('mn-MN')}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono md:px-6">
                                            {reading.previous_reading.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono md:px-6">
                                            {reading.current_reading.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right md:px-6">
                                            <span className="font-medium text-blue-600">
                                                {reading.consumption.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-medium md:px-6">
                                            ₮{reading.total_amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-sm text-gray-500">
                            Нийт {totalCount}-с {currentPage * ITEMS_PER_PAGE + 1} - {Math.min((currentPage + 1) * ITEMS_PER_PAGE, totalCount)} харуулж байна
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Өмнөх
                            </Button>
                            <span className="px-3 text-sm">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                            >
                                Дараах
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
