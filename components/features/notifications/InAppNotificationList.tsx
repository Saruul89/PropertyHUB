"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  ExternalLink,
  Receipt,
  Wrench,
  BellRing,
  Megaphone,
} from "lucide-react";
import { useAuth, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATION_STATUS_COLORS,
  getNotificationPath,
} from "@/lib/constants";
import type { Notification } from "@/types";

const NOTIFICATION_TYPE_ICONS = {
  billing: Receipt,
  reminder: BellRing,
  maintenance: Wrench,
  announcement: Megaphone,
} as const;

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function InAppNotificationList() {
  const { companyId } = useAuth();
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    companyId: companyId ?? undefined,
    limit: 50,
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== "read") {
      await markAsRead(notification.id);
    }

    const path = getNotificationPath(notification.related_type, notification.related_id);
    if (path) {
      router.push(path);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Апп дотор мэдэгдэл
            </CardTitle>
            <CardDescription>
              Системээс ирсэн мэдэгдлүүд
            </CardDescription>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Бүгдийг уншсан ({unreadCount})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8" />
            <p>Мэдэгдэл байхгүй</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_TYPE_ICONS[notification.type] || Bell;
              const hasLink = !!getNotificationPath(notification.related_type, notification.related_id);
              const isUnread = notification.status !== "read";

              return (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-all hover:shadow-md",
                    isUnread
                      ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "rounded-lg p-2",
                        NOTIFICATION_TYPE_COLORS[notification.type]
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            NOTIFICATION_TYPE_COLORS[notification.type]
                          )}
                        >
                          {NOTIFICATION_TYPE_LABELS[notification.type]}
                        </Badge>
                        {isUnread ? (
                          <Badge className="bg-blue-500 text-white text-xs">
                            Шинэ
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn("text-xs", NOTIFICATION_STATUS_COLORS.read)}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Уншсан
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                        {hasLink && (
                          <span className="flex items-center gap-1 text-xs text-blue-600">
                            <ExternalLink className="h-3 w-3" />
                            Дэлгэрэнгүй харах
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
