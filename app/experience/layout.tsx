"use client";

import Link from "next/link";
import { ExperienceSidebar } from "@/components/layout/experience-sidebar";
import { Info, X, ArrowRight } from "lucide-react";
import { useState } from "react";

function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Info className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm font-medium">
            Энэ бол туршилтын хувилбар. Багтаагүй функцууд олон бөгөөд бүрэн
            хэрэглэхийн тулд бүртгүүлнэ үү.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="hidden sm:inline-flex items-center gap-1.5 bg-black text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-black/80 transition-colors"
          >
            Бүртгүүлэх
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-black/10 rounded transition-colors"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ExperienceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Demo Banner - Fixed at top */}
      <div className="fixed top-0 left-64 right-0 z-50">
        <DemoBanner />
      </div>

      {/* Sidebar */}
      <ExperienceSidebar />

      {/* Main Content with top padding for banner */}
      <main className="ml-64 min-h-screen pt-10">{children}</main>
    </div>
  );
}
