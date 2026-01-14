'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

export type NotificationSettingsData = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  billingNotifications: boolean;
  paymentNotifications: boolean;
  maintenanceNotifications: boolean;
  leaseNotifications: boolean;
  reminderDays: number;
};

async function fetchNotificationSettings(): Promise<NotificationSettingsData | null> {
  const res = await fetch('/api/settings/notifications');
  if (!res.ok) return null;
  const data = await res.json();
  return data.settings;
}

async function updateNotificationSettings(settings: NotificationSettingsData): Promise<void> {
  const res = await fetch('/api/settings/notifications', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Тохиргоо хадгалахад алдаа гарлаа');
  }
}

export function useNotificationSettings(companyId: string | null) {
  return useQuery({
    queryKey: queryKeys.notifications.settings(companyId!),
    queryFn: fetchNotificationSettings,
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
