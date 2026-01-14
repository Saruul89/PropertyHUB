"use client";

import { Header } from "@/components/layout/header";
import {
  NotificationHistory,
  InAppNotificationList,
} from "@/components/features/notifications";

export default function NotificationsPage() {
  return (
    <>
      <Header title="Мэдэгдлийн түүх" showBack />
      <div className="space-y-6 p-4 md:p-6">
        <InAppNotificationList />
        <NotificationHistory />
      </div>
    </>
  );
}
