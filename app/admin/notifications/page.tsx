'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import {
    Bell,
    Search,
    Mail,
    MessageSquare,
    CheckCircle,
    XCircle,
    Clock,
    Send,
    Building2,
} from 'lucide-react';
import type { Notification, Company } from '@/types';

interface NotificationWithCompany extends Notification {
    company: Company;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationWithCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterChannel, setFilterChannel] = useState<string>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('notifications')
            .select('*, companies(*)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
            return;
        }

        type NotificationData = Notification & { companies?: Company };

        const notificationsWithCompany: NotificationWithCompany[] = ((data || []) as NotificationData[])
            .filter((n) => n.companies)
            .map((n) => ({
                ...n,
                company: n.companies as Company,
            }));

        setNotifications(notificationsWithCompany);
        setLoading(false);
    };

    const retryNotification = async (notificationId: string) => {
        const supabase = createClient();

        const { error } = await supabase
            .from('notifications')
            .update({ status: 'pending' })
            .eq('id', notificationId);

        if (!error) {
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, status: 'pending' } : n)
            );
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        const matchesSearch =
            notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            notification.company.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
        const matchesChannel = filterChannel === 'all' || notification.channel === filterChannel;
        return matchesSearch && matchesStatus && matchesChannel;
    });

    // Stats
    const stats = {
        total: notifications.length,
        pending: notifications.filter(n => n.status === 'pending').length,
        sent: notifications.filter(n => n.status === 'sent').length,
        failed: notifications.filter(n => n.status === 'failed').length,
        read: notifications.filter(n => n.status === 'read').length,
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'read': return <CheckCircle className="h-4 w-4 text-blue-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'sent': return 'Илгээсэн';
            case 'read': return 'Уншсан';
            case 'failed': return 'Амжилтгүй';
            case 'pending': return 'Хүлээгдэж буй';
            default: return status;
        }
    };

    const getChannelIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail className="h-4 w-4" />;
            case 'sms': return <MessageSquare className="h-4 w-4" />;
            case 'in_app': return <Bell className="h-4 w-4" />;
            default: return <Bell className="h-4 w-4" />;
        }
    };

    const getChannelLabel = (channel: string) => {
        switch (channel) {
            case 'email': return 'Имэйл';
            case 'sms': return 'SMS';
            case 'in_app': return 'Апп доторх';
            default: return channel;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'billing': return 'Төлбөр';
            case 'reminder': return 'Сануулга';
            case 'maintenance': return 'Засвар';
            case 'announcement': return 'Мэдэгдэл';
            default: return type;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Мэдэгдлийн удирдлага</h1>
                <p className="text-gray-600">Системийн мэдэгдлийн байдлыг хянах, удирдах</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Нийт</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <Bell className="h-8 w-8 text-gray-400" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Хүлээгдэж буй</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                        </div>
                        <Clock className="h-8 w-8 text-orange-400" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Илгээсэн</p>
                            <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                        </div>
                        <Send className="h-8 w-8 text-green-400" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Уншсан</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.read}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-400" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Амжилтгүй</p>
                            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                        </div>
                        <XCircle className="h-8 w-8 text-red-400" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Гарчиг, агуулга, компанийн нэрээр хайх..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm text-gray-500 whitespace-nowrap">Төлөв:</Label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="border rounded px-3 py-2 text-sm"
                                >
                                    <option value="all">Бүгд</option>
                                    <option value="pending">Хүлээгдэж буй</option>
                                    <option value="sent">Илгээсэн</option>
                                    <option value="read">Уншсан</option>
                                    <option value="failed">Амжилтгүй</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm text-gray-500 whitespace-nowrap">Суваг:</Label>
                                <select
                                    value={filterChannel}
                                    onChange={(e) => setFilterChannel(e.target.value)}
                                    className="border rounded px-3 py-2 text-sm"
                                >
                                    <option value="all">Бүгд</option>
                                    <option value="email">Имэйл</option>
                                    <option value="sms">SMS</option>
                                    <option value="in_app">Апп доторх</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle>Мэдэгдлийн жагсаалт ({filteredNotifications.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Ачааллаж байна...</div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {searchQuery || filterStatus !== 'all' || filterChannel !== 'all'
                                ? 'Тохирох мэдэгдэл олдсонгүй'
                                : 'Мэдэгдэл байхгүй'
                            }
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getStatusIcon(notification.status)}
                                                <span className="font-medium">{notification.title}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    notification.type === 'billing' ? 'bg-blue-100 text-blue-800' :
                                                    notification.type === 'reminder' ? 'bg-orange-100 text-orange-800' :
                                                    notification.type === 'maintenance' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {getTypeLabel(notification.type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {notification.company.name}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {getChannelIcon(notification.channel)}
                                                    {getChannelLabel(notification.channel)}
                                                </span>
                                                <span>
                                                    {notification.recipient_email || notification.recipient_phone || '-'}
                                                </span>
                                                <span>
                                                    {new Date(notification.created_at).toLocaleString('mn-MN')}
                                                </span>
                                            </div>
                                            {notification.error_message && (
                                                <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                                                    Алдаа: {notification.error_message}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                notification.status === 'sent' ? 'bg-green-100 text-green-800' :
                                                notification.status === 'read' ? 'bg-blue-100 text-blue-800' :
                                                notification.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                'bg-orange-100 text-orange-800'
                                            }`}>
                                                {getStatusLabel(notification.status)}
                                            </span>
                                            {notification.status === 'failed' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => retryNotification(notification.id)}
                                                >
                                                    Дахин илгээх
                                                </Button>
                                            )}
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
