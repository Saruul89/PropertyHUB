"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth, useNotifications } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_COLORS,
  getNotificationPath,
} from "@/lib/constants";
import type { Notification } from "@/types";

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Саяхан";
  if (diffMins < 60) return `${diffMins} минутын өмнө`;
  if (diffHours < 24) return `${diffHours} цагийн өмнө`;
  if (diffDays < 7) return `${diffDays} өдрийн өмнө`;
  return date.toLocaleDateString("mn-MN");
};

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
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
    limit: 5,
  });

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== "read") {
      await markAsRead(notification.id);
    }

    // Navigate to related page if available
    const path = getNotificationPath(notification.related_type, notification.related_id);
    if (path) {
      setOpen(false);
      router.push(path);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-slate-100"
        >
          <Bell className="h-5 w-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-white border shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-900">Мэдэгдэл</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Бүгдийг уншсан
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Мэдэгдэл байхгүй
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const hasLink = !!getNotificationPath(notification.related_type, notification.related_id);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-gray-50",
                      notification.status !== "read" && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                          notification.status !== "read"
                            ? "bg-blue-500"
                            : "bg-transparent"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium",
                              NOTIFICATION_TYPE_COLORS[notification.type]
                            )}
                          >
                            {NOTIFICATION_TYPE_LABELS[notification.type]}
                          </span>
                          {notification.status === "read" && (
                            <Check className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <p className="text-[10px] text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {hasLink && (
                            <ExternalLink className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-4 py-2">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block w-full rounded-md py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Бүгдийг харах
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
