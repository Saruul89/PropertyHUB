"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import type { NotificationQueueItem } from "@/types";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  billing_issued: "請求発行",
  payment_reminder: "支払リマインダー",
  overdue_notice: "延滞通知",
  payment_confirmed: "支払確認",
  lease_expiring: "契約期限",
  maintenance_update: "Засвартай",
  account_created: "アカウント作成",
};

const STATUS_CONFIG = {
  pending: { label: "待機中", variant: "secondary" as const, icon: Clock },
  sent: { label: "送信済み", variant: "default" as const, icon: CheckCircle2 },
  failed: { label: "失敗", variant: "destructive" as const, icon: AlertCircle },
  skipped: { label: "スキップ", variant: "outline" as const, icon: Ban },
};

interface NotificationWithTenant extends NotificationQueueItem {
  tenants?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
}

export function NotificationHistory() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationWithTenant[]>(
    []
  );
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (channelFilter !== "all") {
        params.set("channel", channelFilter);
      }
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (typeFilter !== "all") {
        params.set("type", typeFilter);
      }

      const res = await fetch(`/api/notifications/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch notification history:", error);
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    channelFilter,
    statusFilter,
    typeFilter,
  ]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>通知履歴</CardTitle>
        <CardDescription>送信済み・待機中の通知一覧</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="チャネル" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="email">メール</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="pending">待機中</SelectItem>
              <SelectItem value="sent">送信済み</SelectItem>
              <SelectItem value="failed">失敗</SelectItem>
              <SelectItem value="skipped">スキップ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="通知タイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Mail className="mb-2 h-8 w-8" />
            <p>通知履歴がありません</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日時</TableHead>
                    <TableHead>タイプ</TableHead>
                    <TableHead>チャネル</TableHead>
                    <TableHead>送信先</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>エラー</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => {
                    const statusConfig = STATUS_CONFIG[notification.status];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <TableRow key={notification.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDate(
                            notification.sent_at || notification.created_at
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {NOTIFICATION_TYPE_LABELS[
                              notification.notification_type
                            ] || notification.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.channel === "email" ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>メール</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>SMS</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {notification.tenants?.name || "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {notification.channel === "email"
                                ? notification.tenants?.email
                                : notification.tenants?.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.last_error ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">
                                    {notification.last_error}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                全 {pagination.total} 件中{" "}
                {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                件を表示
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
