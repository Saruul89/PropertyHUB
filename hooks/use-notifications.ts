'use client';

import { useCallback } from 'react';
import {
  useNotificationsQuery,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  getUnreadCount,
} from '@/hooks/queries';
import type { Notification } from '@/types';

type UseNotificationsOptions = {
  recipientId?: string;
  recipientType?: 'tenant' | 'company_user';
  companyId?: string;
  limit?: number;
  onlyUnread?: boolean;
};

type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const { recipientId, recipientType, companyId, limit = 50, onlyUnread = false } = options;

  const { data: notifications = [], isLoading: loading, error, refetch } = useNotificationsQuery({
    recipientId,
    recipientType,
    companyId,
    limit,
    onlyUnread,
  });

  const markAsReadMutation = useMarkNotificationRead();
  const markAllAsReadMutation = useMarkAllNotificationsRead();

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    },
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(async () => {
    // Use companyId for company-wide mark all read
    const targetId = companyId || recipientId;
    if (!targetId) return;
    await markAllAsReadMutation.mutateAsync(targetId);
  }, [companyId, recipientId, markAllAsReadMutation]);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const unreadCount = getUnreadCount(notifications);

  return {
    notifications,
    unreadCount,
    loading,
    error: error?.message ?? null,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
