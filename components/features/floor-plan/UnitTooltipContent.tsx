"use client";

import Link from "next/link";
import { Users, ExternalLink, Grid3X3, FileText } from "lucide-react";
import { UNIT_STATUS_LABELS } from "@/lib/constants";
import type { Unit, Tenant, Lease } from "@/types";

export type UnitWithDetails = Unit & {
  tenant?: Tenant | null;
  lease?: Lease | null;
};

type UnitTooltipContentProps = {
  unit: UnitWithDetails;
  propertyId: string;
  formatCurrency?: (amount: number) => string;
};

const defaultFormatCurrency = (amount: number) => {
  return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
};

export const UnitTooltipContent = ({
  unit,
  propertyId,
  formatCurrency = defaultFormatCurrency,
}: UnitTooltipContentProps) => {
  return (
    <div className="p-3 space-y-2">
      <div className="font-bold text-base border-b pb-2">{unit.unit_number}</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Статус:</span>
          <p className="font-medium">{UNIT_STATUS_LABELS[unit.status]}</p>
        </div>
        <div>
          <span className="text-gray-500">Талбай:</span>
          <p className="font-medium">
            {unit.area_sqm ? `${unit.area_sqm}m²` : "-"}
          </p>
        </div>
        {unit.monthly_rent && (
          <div>
            <span className="text-gray-500">Түрээс:</span>
            <p className="font-medium">{formatCurrency(unit.monthly_rent)}</p>
          </div>
        )}
        {unit.tenant && (
          <div>
            <span className="text-gray-500">Түрээслэгч:</span>
            <p className="font-medium truncate">
              {unit.tenant.tenant_type === "company"
                ? unit.tenant.company_name
                : unit.tenant.name}
            </p>
          </div>
        )}
      </div>
      <div className="pt-2 border-t space-y-1">
        <Link
          href={`/dashboard/properties/${propertyId}/units/${unit.id}`}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm min-h-[44px] py-2"
        >
          <Grid3X3 className="h-4 w-4" />
          Өрөөний дэлгэрэнгүй
          <ExternalLink className="h-3 w-3" />
        </Link>
        {unit.tenant && (
          <Link
            href={`/dashboard/tenants/${unit.tenant.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm min-h-[44px] py-2"
          >
            <Users className="h-4 w-4" />
            Түрээслэгч харах
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        {unit.lease && (
          <Link
            href={`/dashboard/leases/${unit.lease.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm min-h-[44px] py-2"
          >
            <FileText className="h-4 w-4" />
            Гэрээ харах
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
};
