"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Lease, Tenant, Unit, Property } from "@/types";
import {
  FileText,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export interface LeaseWithRelations extends Lease {
  tenant: Tenant;
  unit: Unit & { property: Property };
}

export interface LeaseListProps {
  leases: LeaseWithRelations[];
  emptyMessage?: string;
  showEmptyAction?: boolean;
  onEmptyActionClick?: () => void;
}

const statusConfig = {
  active: {
    label: "契約中",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  pending: {
    label: "審査中",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  expired: {
    label: "満了",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  terminated: {
    label: "解約済み",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ja-JP").format(amount);
};

const getDaysUntilExpiry = (endDate: string | undefined) => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  const diff = Math.ceil(
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
};

export function LeaseList({
  leases,
  emptyMessage = "契約がありません",
  showEmptyAction = false,
  onEmptyActionClick,
}: LeaseListProps) {
  if (leases.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-500">{emptyMessage}</p>
          {showEmptyAction && onEmptyActionClick && (
            <button
              onClick={onEmptyActionClick}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              新規契約を作成
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {leases.map((lease) => {
        const status = statusConfig[lease.status];
        const daysUntilExpiry = getDaysUntilExpiry(lease.end_date);
        const StatusIcon = status.icon;

        return (
          <Link key={lease.id} href={`/dashboard/leases/${lease.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${status.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{lease.tenant.name}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {lease.unit.property.name} -{" "}
                            {lease.unit.unit_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <div className="text-gray-500">契約開始日</div>
                        <div className="font-medium">
                          {formatDate(lease.start_date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">契約終了日</div>
                        <div className="font-medium">
                          {lease.end_date
                            ? formatDate(lease.end_date)
                            : "無期限"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Сарын түрээс</div>
                        <div className="font-medium">
                          ¥{formatCurrency(lease.monthly_rent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">保証金</div>
                        <div className="font-medium">
                          ¥{formatCurrency(lease.deposit)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                    {daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      daysUntilExpiry > 0 &&
                      lease.status === "active" && (
                        <div className="mt-2 text-xs text-orange-600">
                          あと{daysUntilExpiry}日で満了
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
