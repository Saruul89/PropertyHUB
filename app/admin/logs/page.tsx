'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    FileText,
    Building2,
    Users,
    Settings,
    CreditCard,
} from 'lucide-react';
import type { AdminAuditLog, AuditAction } from '@/types/admin';

const actionLabels: Record<AuditAction, string> = {
    company_view: 'Компани харах',
    company_edit: 'Компани засах',
    company_suspend: 'Компани түдгэлзүүлэх',
    company_activate: 'Компани идэвхжүүлэх',
    company_delete: 'Компани устгах',
    features_change: 'Функц өөрчлөх',
    subscription_change: 'Захиалга өөрчлөх',
    admin_create: 'Админ үүсгэх',
    admin_edit: 'Админ засах',
    admin_delete: 'Админ устгах',
    settings_change: 'Тохиргоо өөрчлөх',
    login: 'Нэвтрэх',
    logout: 'Гарах',
};

const actionBadgeColors: Record<string, string> = {
    company_view: 'bg-gray-100 text-gray-800',
    company_edit: 'bg-blue-100 text-blue-800',
    company_suspend: 'bg-orange-100 text-orange-800',
    company_activate: 'bg-green-100 text-green-800',
    company_delete: 'bg-red-100 text-red-800',
    features_change: 'bg-purple-100 text-purple-800',
    subscription_change: 'bg-indigo-100 text-indigo-800',
    admin_create: 'bg-teal-100 text-teal-800',
    admin_edit: 'bg-cyan-100 text-cyan-800',
    admin_delete: 'bg-red-100 text-red-800',
    settings_change: 'bg-yellow-100 text-yellow-800',
    login: 'bg-green-100 text-green-800',
    logout: 'bg-gray-100 text-gray-800',
};

const getActionIcon = (action: AuditAction) => {
    if (action.startsWith('company_')) return <Building2 className="h-4 w-4" />;
    if (action.startsWith('admin_')) return <Users className="h-4 w-4" />;
    if (action === 'settings_change') return <Settings className="h-4 w-4" />;
    if (action.includes('subscription') || action.includes('features')) return <CreditCard className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
};

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AdminAuditLog[]>([]);
    const [admins, setAdmins] = useState<Record<string, { name: string; email: string }>>({});
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

    const [filters, setFilters] = useState({
        start_date: '',
        end_date: '',
        action: 'all',
        target_type: 'all',
    });

    const limit = 20;

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: (page * limit).toString(),
            });

            if (filters.start_date) params.set('start_date', filters.start_date);
            if (filters.end_date) params.set('end_date', filters.end_date);
            if (filters.action && filters.action !== 'all') params.set('action', filters.action);
            if (filters.target_type && filters.target_type !== 'all') params.set('target_type', filters.target_type);

            const res = await fetch(`/api/admin/logs?${params}`);
            const data = await res.json();

            if (data.success) {
                setLogs(data.data.logs);
                setAdmins(data.data.admins || {});
                setTotal(data.data.total);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            start_date: '',
            end_date: '',
            action: 'all',
            target_type: 'all',
        });
        setPage(0);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('mn-MN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getAdminName = (log: AdminAuditLog) => {
        if (log.admin_id && admins[log.admin_id]) {
            return admins[log.admin_id].name || admins[log.admin_id].email;
        }
        return log.admin_email;
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Хяналтын лог</h1>
                <p className="text-gray-600">Системийн админы үйл ажиллагааны түүх</p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Шүүлтүүр</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="space-y-2">
                            <Label>Эхлэх огноо</Label>
                            <Input
                                type="date"
                                value={filters.start_date}
                                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Дуусах огноо</Label>
                            <Input
                                type="date"
                                value={filters.end_date}
                                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Үйлдлийн төрөл</Label>
                            <Select
                                value={filters.action}
                                onValueChange={(value) => handleFilterChange('action', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Бүгд" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Бүгд</SelectItem>
                                    <SelectItem value="company_view">Компани харах</SelectItem>
                                    <SelectItem value="company_edit">Компани засах</SelectItem>
                                    <SelectItem value="company_suspend">Компани түдгэлзүүлэх</SelectItem>
                                    <SelectItem value="company_activate">Компани идэвхжүүлэх</SelectItem>
                                    <SelectItem value="company_delete">Компани устгах</SelectItem>
                                    <SelectItem value="features_change">Функц өөрчлөх</SelectItem>
                                    <SelectItem value="subscription_change">Захиалга өөрчлөх</SelectItem>
                                    <SelectItem value="admin_create">Админ үүсгэх</SelectItem>
                                    <SelectItem value="admin_edit">Админ засах</SelectItem>
                                    <SelectItem value="admin_delete">Админ устгах</SelectItem>
                                    <SelectItem value="settings_change">Тохиргоо өөрчлөх</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Объектын төрөл</Label>
                            <Select
                                value={filters.target_type}
                                onValueChange={(value) => handleFilterChange('target_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Бүгд" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Бүгд</SelectItem>
                                    <SelectItem value="company">Компани</SelectItem>
                                    <SelectItem value="admin">Админ</SelectItem>
                                    <SelectItem value="subscription">Захиалга</SelectItem>
                                    <SelectItem value="settings">Тохиргоо</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button onClick={fetchLogs} variant="outline">
                                <Search className="mr-2 h-4 w-4" />
                                Хайх
                            </Button>
                            <Button onClick={clearFilters} variant="ghost">
                                Цэвэрлэх
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Логийн жагсаалт</CardTitle>
                    <span className="text-sm text-gray-500">
                        {total.toLocaleString()}
                    </span>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Ачааллаж байна...</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Лог байхгүй
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Огноо</TableHead>
                                        <TableHead>Хэрэглэгч</TableHead>
                                        <TableHead>Үйлдэл</TableHead>
                                        <TableHead>Объект</TableHead>
                                        <TableHead className="text-right">Дэлгэрэнгүй</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </TableCell>
                                            <TableCell>{getAdminName(log)}</TableCell>
                                            <TableCell>
                                                <Badge className={actionBadgeColors[log.action] || 'bg-gray-100 text-gray-800'}>
                                                    {getActionIcon(log.action)}
                                                    <span className="ml-1">
                                                        {actionLabels[log.action] || log.action}
                                                    </span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {log.target_name || log.target_id || '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    Дэлгэрэнгүй
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <span className="text-sm text-gray-500">
                                    {page * limit + 1} - {Math.min((page + 1) * limit, total)} / {total}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Өмнөх
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page >= totalPages - 1}
                                    >
                                        Дараах
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Логийн дэлгэрэнгүй</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Огноо</Label>
                                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Хэрэглэгч</Label>
                                    <p className="font-medium">{getAdminName(selectedLog)}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Үйлдэл</Label>
                                    <Badge className={actionBadgeColors[selectedLog.action] || 'bg-gray-100'}>
                                        {actionLabels[selectedLog.action] || selectedLog.action}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-gray-500">Объект</Label>
                                    <p className="font-medium">
                                        {selectedLog.target_type && (
                                            <span className="text-gray-500">[{selectedLog.target_type}] </span>
                                        )}
                                        {selectedLog.target_name || selectedLog.target_id || '-'}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.notes && (
                                <div>
                                    <Label className="text-gray-500">Тэмдэглэл</Label>
                                    <p className="font-medium">{selectedLog.notes}</p>
                                </div>
                            )}

                            {selectedLog.old_value && Object.keys(selectedLog.old_value).length > 0 && (
                                <div>
                                    <Label className="text-gray-500">Өмнөх утга</Label>
                                    <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                                        {JSON.stringify(selectedLog.old_value, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.new_value && Object.keys(selectedLog.new_value).length > 0 && (
                                <div>
                                    <Label className="text-gray-500">Шинэ утга</Label>
                                    <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-sm overflow-auto max-h-40">
                                        {JSON.stringify(selectedLog.new_value, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                <div>
                                    <Label className="text-gray-500">IP хаяг</Label>
                                    <p className="text-sm">{selectedLog.ip_address || '-'}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-500">User Agent</Label>
                                    <p className="text-sm truncate" title={selectedLog.user_agent || undefined}>
                                        {selectedLog.user_agent || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
