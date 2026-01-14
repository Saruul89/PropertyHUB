"use client";

import Link from "next/link";
import { Users, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveTooltip } from "./ResponsiveTooltip";
import { UnitTooltipContent, UnitWithDetails } from "./UnitTooltipContent";
import { UNIT_STATUS_LABELS, UNIT_STATUS_FLOOR_PLAN_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type GridFloorViewProps = {
  units: UnitWithDetails[];
  propertyId: string;
  className?: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
};

export const GridFloorView = ({
  units,
  propertyId,
  className,
}: GridFloorViewProps) => {
  if (units.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-lg min-h-[200px]",
          className
        )}
      >
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Home className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium mb-2">Өрөө бүртгэгдээгүй байна</p>
        <p className="text-sm text-gray-500 mb-4">Энэ давхарт өрөө нэмэх</p>
        <Link href={`/dashboard/properties/${propertyId}/units`}>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Өрөө нэмэх
          </Button>
        </Link>
      </div>
    );
  }

  const sortedUnits = [...units].sort((a, b) =>
    a.unit_number.localeCompare(b.unit_number)
  );

  return (
    <div
      className={cn(
        "flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg min-h-[200px]",
        className
      )}
    >
      {sortedUnits.map((unit) => (
        <ResponsiveTooltip
          key={unit.id}
          title={unit.unit_number}
          content={
            <UnitTooltipContent
              unit={unit}
              propertyId={propertyId}
              formatCurrency={formatCurrency}
            />
          }
        >
          <div
            className={cn(
              "rounded-lg border-2 p-3 cursor-pointer transition-all duration-200",
              "hover:shadow-md hover:scale-105",
              "flex flex-col items-center justify-center text-center",
              "min-w-[100px] sm:min-w-[120px] min-h-[80px]",
              UNIT_STATUS_FLOOR_PLAN_COLORS[unit.status]
            )}
          >
            <span className="text-lg font-bold">{unit.unit_number}</span>
            {unit.area_sqm && (
              <span className="text-sm text-gray-600">{unit.area_sqm}m²</span>
            )}
            {unit.status === "occupied" && unit.tenant ? (
              <span className="text-xs text-gray-600 truncate max-w-full mt-1">
                {unit.tenant.tenant_type === "company"
                  ? unit.tenant.company_name
                  : unit.tenant.name}
              </span>
            ) : (
              <span className="text-xs mt-1">
                {UNIT_STATUS_LABELS[unit.status]}
              </span>
            )}
            {unit.status === "occupied" && (
              <Users className="h-4 w-4 text-green-600 mt-1" />
            )}
          </div>
        </ResponsiveTooltip>
      ))}
    </div>
  );
};
