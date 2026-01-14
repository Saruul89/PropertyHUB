"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks";
import { useRouter } from "next/navigation";
import { User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/features/notifications";
import Link from "next/link";

type HeaderProps = {
  title?: string;
  showBack?: boolean;
  action?: ReactNode;
};

export function Header({ title, showBack, action }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-4">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-gray-900">
          {title || "Хянах самбар"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {action}

        <NotificationDropdown />

        <Link href="/dashboard/settings/company">
          <div className="flex items-center gap-3 rounded-full bg-gray-50 px-3 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 pr-1">
              {user?.user_metadata?.company_name || user?.email}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
