"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MaintenanceRequest, Unit, Property, Tenant } from "@/types";
import {
  Wrench,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  DollarSign,
  User,
} from "lucide-react";

export interface MaintenanceWithRelations extends MaintenanceRequest {
  unit: Unit & { property: Property };
  tenant?: Tenant;
}

export interface MaintenanceListProps {
  requests: MaintenanceWithRelations[];
  showVendorInfo?: boolean;
  emptyMessage?: string;
  showEmptyAction?: boolean;
  onEmptyActionClick?: () => void;
}

const statusConfig = {
  pending: {
    label: "未対応",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  in_progress: {
    label: "対応中",
    icon: Wrench,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  completed: {
    label: "完了",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  cancelled: {
    label: "キャンセル",
    icon: XCircle,
    color: "text-gray-600",
    bg: "bg-gray-50",
  },
};

const priorityConfig = {
  low: { label: "低", color: "bg-gray-100 text-gray-700" },
  normal: { label: "中", color: "bg-blue-100 text-blue-700" },
  high: { label: "高", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "緊急", color: "bg-red-100 text-red-700" },
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ja-JP");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("ja-JP").format(amount);
};

export function MaintenanceList({
  requests,
  showVendorInfo = false,
  emptyMessage = "Засвартайリクエストがありません",
  showEmptyAction = false,
  onEmptyActionClick,
}: MaintenanceListProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wrench className="mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-500">{emptyMessage}</p>
          {showEmptyAction && onEmptyActionClick && (
            <button
              onClick={onEmptyActionClick}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              新規リクエストを作成
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status];
        const priority = priorityConfig[request.priority];
        const StatusIcon = status.icon;

        return (
          <Link key={request.id} href={`/dashboard/maintenance/${request.id}`}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${status.bg}`}>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{request.title}</h3>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${priority.color}`}
                          >
                            {priority.label}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {request.unit.property.name} -{" "}
                            {request.unit.unit_number}
                          </span>
                          {request.category && (
                            <span className="text-gray-400">
                              {request.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {request.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                        {request.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      {request.tenant && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <User className="h-3 w-3" />
                          {request.tenant.name}
                        </span>
                      )}
                      {showVendorInfo && request.vendor_name && (
                        <span className="flex items-center gap-1 text-gray-500">
                          <Wrench className="h-3 w-3" />
                          {request.vendor_name}
                        </span>
                      )}
                      {showVendorInfo &&
                        (request.estimated_cost || request.actual_cost) && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <DollarSign className="h-3 w-3" />
                            {request.actual_cost
                              ? `¥${formatCurrency(request.actual_cost)}`
                              : request.estimated_cost
                              ? `見積: ¥${formatCurrency(
                                  request.estimated_cost
                                )}`
                              : ""}
                          </span>
                        )}
                      {request.scheduled_date && (
                        <span className="text-gray-500">
                          予定: {formatDate(request.scheduled_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
                    >
                      {status.label}
                    </span>
                    <div className="mt-2 text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </div>
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
