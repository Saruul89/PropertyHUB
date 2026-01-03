"use client";

import { useAuth } from "@/hooks";
import { TenantSidebar } from "@/components/layout/tenant-sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
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
