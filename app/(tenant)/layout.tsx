"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Loading } from "@/components/ui/loading";

function TenantLayoutContent({ children }: { children: React.ReactNode }) {
  const { loading, user, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && role === "company_admin") {
      router.push("/dashboard");
    }
    if (!loading && role === "company_staff") {
      router.push("/dashboard");
    }
    if (!loading && role === "system_admin") {
      router.push("/admin/dashboard");
    }
  }, [loading, user, role, router]);

  if (loading) {
    return <Loading fullPage />;
  }

  if (!user || role !== "tenant") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TenantSidebar />
      <main className="ml-64">{children}</main>
    </div>
  );
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TenantLayoutContent>{children}</TenantLayoutContent>
      </AuthProvider>
    </QueryProvider>
  );
}
