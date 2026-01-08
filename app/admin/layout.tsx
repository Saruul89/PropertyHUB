"use client";

import { useAuth } from "@/hooks";
import { AdminSidebar } from "@/components/layout";
import { AuthProvider } from "@/providers/auth-provider";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, user, role } = useAuth();

  console.log('[AdminLayout] render, loading:', loading, 'user:', !!user, 'role:', role);

  // middlewareでリダイレクト処理を行うため、ここではloading状態の表示のみ
  if (loading) {
    console.log('[AdminLayout] showing loading...');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  // middlewareが未認証・非adminユーザーをリダイレクトするため、念のためのガード
  if (!user || role !== "system_admin") {
    console.log('[AdminLayout] no user or not system_admin, returning null');
    return null;
  }

  console.log('[AdminLayout] rendering content');
  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
