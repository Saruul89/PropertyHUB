"use client";

import { useAuth } from "@/hooks";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  // middlewareでリダイレクト処理を行うため、ここではloading状態の表示のみ
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  // middlewareが未認証ユーザーをリダイレクトするため、念のためのガード
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64">{children}</main>
    </div>
  );
}
