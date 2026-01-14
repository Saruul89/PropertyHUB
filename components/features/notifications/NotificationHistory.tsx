"use client";

import { useState } from "react";
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
import { useNotificationHistory } from "@/hooks/queries";

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  billing_issued: "Нэхэмжлэх",
  payment_reminder: "Төлбөрийн сануулга",
  overdue_notice: "Хугацаа хэтэрсэн мэдэгдэл",
  payment_confirmed: "Төлбөр баталгаажсан",
  lease_expiring: "Гэрээ дуусах мэдэгдэл",
  maintenance_update: "Засварын мэдэгдэл",
  account_created: "Бүртгэл үүссэн",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "secondary" | "default" | "destructive" | "outline";
    icon: typeof Clock;
  }
> = {
  pending: { label: "Хүлээгдэж буй", variant: "secondary", icon: Clock },
  sent: { label: "Илгээсэн", variant: "default", icon: CheckCircle2 },
  failed: { label: "Алдаа", variant: "destructive", icon: AlertCircle },
  read: { label: "Уншсан", variant: "outline", icon: CheckCircle2 },
  skipped: { label: "Алгассан", variant: "outline", icon: Ban },
};

export function NotificationHistory() {
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading: loading } = useNotificationHistory({
    page,
    limit: 20,
    channel:
      channelFilter !== "all" ? (channelFilter as "email" | "sms") : undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as "pending" | "sent" | "failed")
        : undefined,
    type:
      typeFilter !== "all"
        ? (typeFilter as "billing" | "maintenance" | "lease" | "system")
        : undefined,
  });

  const notifications = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, totalPages: 0 };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("mn-MN", {
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
        <CardTitle>Мэдэгдлийн түүх</CardTitle>
        <CardDescription>
          Илгээсэн・Хүлээгдэж буй мэдэгдлийн түүх
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Суваг" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="email">Имэйл</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
              <SelectItem value="pending">Хүлээгдэж буй</SelectItem>
              <SelectItem value="sent">Илгээсэн</SelectItem>
              <SelectItem value="failed">Алдаа</SelectItem>
              <SelectItem value="skipped">Алгассан</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Мэдэгдлийн төрөл" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Бүгд</SelectItem>
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
            <p>Мэдэгдлийн түүх олдсонгүй</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Огноо</TableHead>
                    <TableHead>Төрөл</TableHead>
                    <TableHead>Суваг</TableHead>
                    <TableHead>Илгээгч</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Алдаа</TableHead>
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
                              notification.notification_type as keyof typeof NOTIFICATION_TYPE_LABELS
                            ] || notification.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {notification.channel === "email" ? (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>Имэйл</span>
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
                Нийт {pagination.total} зүйлээс {(page - 1) * 20 + 1} -{" "}
                {Math.min(page * 20, pagination.total)} харуулж байна
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
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
