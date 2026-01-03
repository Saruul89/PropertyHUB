"use client";

import { useAuth } from "@/hooks";
import { AdminSidebar } from "@/components/layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user, role } = useAuth();

  // middlewareでリダイレクト処理を行うため、ここではloading状態の表示のみ
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  // middlewareが未認証・非adminユーザーをリダイレクトするため、念のためのガード
  if (!user || role !== "system_admin") {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
