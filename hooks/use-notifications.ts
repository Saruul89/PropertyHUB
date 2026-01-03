'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/types';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface UseNotificationsOptions {
    recipientId?: string;
    recipientType?: 'tenant' | 'company_user';
    limit?: number;
    onlyUnread?: boolean;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
    const {
        recipientId,
        recipientType,
        limit = 50,
        onlyUnread = false,
    } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!recipientId) {
            setLoading(false);
            return;
        }

        const supabase = createClient();

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', recipientId)
            .eq('channel', 'in_app')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (recipientType) {
            query = query.eq('recipient_type', recipientType);
        }

        if (onlyUnread) {
            query = query.neq('status', 'read');
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setNotifications(data || []);
        }

        setLoading(false);
    }, [recipientId, recipientType, limit, onlyUnread]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Subscribe to realtime updates
    useEffect(() => {
        if (!recipientId) return;

        const supabase = createClient();

        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `recipient_id=eq.${recipientId}`,
                },
                (payload: RealtimePostgresInsertPayload<Notification>) => {
                    const newNotification = payload.new;
                    if (newNotification.channel === 'in_app') {
                        setNotifications((prev) => [newNotification, ...prev].slice(0, limit));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [recipientId, limit]);

    const markAsRead = useCallback(async (notificationId: string) => {
        const supabase = createClient();

        const { error: updateError } = await supabase
            .from('notifications')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('id', notificationId);

        if (!updateError) {
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, status: 'read', read_at: new Date().toISOString() } : n
                )
            );
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        if (!recipientId) return;

        const supabase = createClient();

        const { error: updateError } = await supabase
            .from('notifications')
            .update({ status: 'read', read_at: new Date().toISOString() })
            .eq('recipient_id', recipientId)
            .neq('status', 'read');

        if (!updateError) {
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
            );
        }
    }, [recipientId]);

    const unreadCount = notifications.filter((n) => n.status !== 'read').length;

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    };
}
