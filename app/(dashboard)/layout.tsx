"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Loading } from "@/components/ui/loading";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, user, companyId } = useAuth();
  const router = useRouter();

  console.log('[DashboardLayout] render, loading:', loading, 'user:', !!user, 'companyId:', companyId);

  useEffect(() => {
    if (!loading && !user) {
      console.log('[DashboardLayout] no user, redirecting to login');
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    console.log('[DashboardLayout] showing loading...');
    return <Loading fullPage />;
  }

  if (!user) {
    // リダイレクト中はローディングを表示
    return <Loading fullPage />;
  }

  console.log('[DashboardLayout] rendering content');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <Sidebar />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </AuthProvider>
    </QueryProvider>
  );
}
