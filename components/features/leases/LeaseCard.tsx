"use client";

import { Building2, Home, Calendar } from "lucide-react";
import { LeaseStatusBadge } from "./LeaseStatusBadge";
import type { Lease, Unit, Property } from "@/types";

interface LeaseWithUnit extends Lease {
  unit?: Unit & { property?: Property };
}

interface LeaseCardProps {
  lease: LeaseWithUnit;
}

export function LeaseCard({ lease }: LeaseCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium">
            {lease.unit?.property?.name || "Барилгын нэр тодорхойгүй"}
          </span>
          <span className="text-gray-500">-</span>
          <Home className="h-4 w-4 text-gray-400" />
          <span>{lease.unit?.unit_number || "Өрөөний дугаар тодорхойгүй"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>
            {lease.start_date}
            {lease.end_date && ` ~ ${lease.end_date}`}
          </span>
        </div>
      </div>
      <div className="text-right">
        <LeaseStatusBadge status={lease.status} />
        <p className="mt-1 font-medium">
          ₮{lease.monthly_rent.toLocaleString()}/сар
        </p>
      </div>
    </div>
  );
}
