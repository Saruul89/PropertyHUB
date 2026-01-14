'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from './keys';
import type { Notification } from '@/types';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

export type NotificationFilters = {
  recipientId?: string;
  recipientType?: 'tenant' | 'company_user';
  companyId?: string; // For fetching company-wide notifications
  limit?: number;
  onlyUnread?: boolean;
};

export type NotificationHistoryFilters = {
  page?: number;
  limit?: number;
  channel?: 'email' | 'sms' | 'all';
  status?: 'pending' | 'sent' | 'failed' | 'skipped' | 'all';
  type?: string;
};

export type NotificationQueueStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export type NotificationHistoryItem = {
  id: string;
  company_id: string;
  recipient_type: 'tenant' | 'company_user';
  recipient_id: string;
  notification_type: string;
  channel: 'email' | 'sms';
  status: NotificationQueueStatus;
  sent_at?: string;
  created_at: string;
  last_error?: string;
  tenants?: { id: string; name: string; email?: string; phone: string };
};

type NotificationHistoryResponse = {
  data: NotificationHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

async function fetchNotifications(filters: NotificationFilters): Promise<Notification[]> {
  const { recipientId, recipientType, companyId, limit = 50, onlyUnread = false } = filters;

  // Either recipientId or companyId is required
  if (!recipientId && !companyId) return [];

  const supabase = createClient();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('channel', 'in_app')
    .order('created_at', { ascending: false })
    .limit(limit);

  // Filter by company_id (for company-wide notifications from tenants)
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  // Filter by recipient_id (for user-specific notifications)
  if (recipientId) {
    query = query.eq('recipient_id', recipientId);
  }

  if (recipientType) {
    query = query.eq('recipient_type', recipientType);
  }

  if (onlyUnread) {
    query = query.neq('status', 'read');
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

async function fetchNotificationHistory(filters: NotificationHistoryFilters): Promise<NotificationHistoryResponse> {
  const { page = 1, limit = 20, channel, status, type } = filters;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (channel && channel !== 'all') params.set('channel', channel);
  if (status && status !== 'all') params.set('status', status);
  if (type && type !== 'all') params.set('type', type);

  const res = await fetch(`/api/notifications/history?${params}`);
  if (!res.ok) throw new Error('Failed to fetch notification history');

  return res.json();
}

async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) throw error;
}

async function markAllNotificationsAsRead(idOrCompanyId: string): Promise<void> {
  const supabase = createClient();

  // Try to mark by company_id first, then by recipient_id
  // This allows marking all company notifications as read
  const { error: companyError } = await supabase
    .from('notifications')
    .update({ status: 'read', read_at: new Date().toISOString() })
    .eq('company_id', idOrCompanyId)
    .neq('status', 'read');

  // If no company match, try recipient_id
  if (companyError) {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('recipient_id', idOrCompanyId)
      .neq('status', 'read');

    if (error) throw error;
  }
}

export function useNotificationsQuery(filters: NotificationFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => fetchNotifications(filters),
    enabled: !!(filters.recipientId || filters.companyId),
    staleTime: 30 * 1000, // 30 seconds for notifications
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!filters.recipientId && !filters.companyId) return;

    const supabase = createClient();

    // Build filter based on recipientId or companyId
    const realtimeFilter = filters.companyId
      ? `company_id=eq.${filters.companyId}`
      : `recipient_id=eq.${filters.recipientId}`;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: realtimeFilter,
        },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const newNotification = payload.new;
          if (newNotification.channel === 'in_app') {
            queryClient.setQueryData<Notification[]>(
              queryKeys.notifications.list(filters),
              (old) => {
                if (!old) return [newNotification];
                return [newNotification, ...old].slice(0, filters.limit || 50);
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.recipientId, filters.companyId, filters.limit, queryClient, filters]);

  return query;
}

export function useNotificationHistory(filters: NotificationHistoryFilters) {
  return useQuery({
    queryKey: queryKeys.notifications.history(filters),
    queryFn: () => fetchNotificationHistory(filters),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

// Helper to calculate unread count
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => n.status !== 'read').length;
}
