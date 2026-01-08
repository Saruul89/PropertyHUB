"use client";

import { cn } from "@/lib/utils";
import { UNIT_STATUS_LABELS } from "@/lib/constants";
import { Unit, Tenant, Lease } from "@/types";
import { Users } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnitBlockProps {
  unit: Unit;
  tenant?: Tenant | null;
  lease?: Lease | null;
  isSelected?: boolean;
  isEditing?: boolean;
  showTooltip?: boolean;
  onClick?: (unit: Unit) => void;
  onDragEnd?: (unitId: string, x: number, y: number) => void;
  onContextMenu?: (e: React.MouseEvent, unit: Unit) => void;
}

const STATUS_COLORS = {
  vacant: "border-blue-400 bg-blue-50 hover:bg-blue-100",
  occupied: "border-green-400 bg-green-50 hover:bg-green-100",
  maintenance: "border-yellow-400 bg-yellow-50 hover:bg-yellow-100",
  reserved: "border-purple-400 bg-purple-50 hover:bg-purple-100",
};

const STATUS_BG_SELECTED = {
  vacant: "border-blue-500 bg-blue-100",
  occupied: "border-green-500 bg-green-100",
  maintenance: "border-yellow-500 bg-yellow-100",
  reserved: "border-purple-500 bg-purple-100",
};

export function UnitBlock({
  unit,
  tenant,
  lease,
  isSelected = false,
  isEditing = false,
  showTooltip = false,
  onClick,
  onDragEnd,
  onContextMenu,
}: UnitBlockProps) {
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (!onDragEnd) return;
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - (unit.width || 100) / 2;
      const y = e.clientY - rect.top - (unit.height || 80) / 2;
      onDragEnd(unit.id, Math.max(0, x), Math.max(0, y));
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, unit);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
  };

  const blockContent = (
    <div
      className={cn(
        "absolute cursor-pointer rounded border-2 transition-all",
        isSelected
          ? STATUS_BG_SELECTED[unit.status]
          : STATUS_COLORS[unit.status]
      )}
      style={{
        left: unit.position_x || 0,
        top: unit.position_y || 0,
        width: unit.width || 100,
        height: unit.height || 80,
      }}
      onClick={() => onClick?.(unit)}
      onContextMenu={handleContextMenu}
      draggable={isEditing}
      onDragEnd={isEditing ? handleDragEnd : undefined}
    >
      <div className="flex h-full flex-col items-center justify-center p-1 text-center">
        <span className="text-sm font-bold">{unit.unit_number}</span>

        {unit.status === "occupied" && tenant ? (
          <span className="text-xs text-gray-600 truncate max-w-full px-1">
            {tenant.tenant_type === "company"
              ? tenant.company_name
              : tenant.name}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            {UNIT_STATUS_LABELS[unit.status]}
          </span>
        )}

        {unit.area_sqm && (
          <span className="text-xs text-gray-500">{unit.area_sqm}m²</span>
        )}

        {unit.status === "vacant" && unit.monthly_rent > 0 && (
          <span className="text-xs text-blue-600 font-medium">
            {formatCurrency(unit.monthly_rent)}
          </span>
        )}

        {unit.status === "occupied" && (
          <Users className="mt-0.5 h-3 w-3 text-green-600" />
        )}
      </div>
    </div>
  );

  if (!showTooltip) {
    return blockContent;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{blockContent}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-medium">{unit.unit_number}</div>
            <div className="text-sm">
              <span className="text-gray-500">Статус: </span>
              {UNIT_STATUS_LABELS[unit.status]}
            </div>
            {unit.area_sqm && (
              <div className="text-sm">
                <span className="text-gray-500">Талбай: </span>
                {unit.area_sqm}m²
              </div>
            )}
            {unit.monthly_rent > 0 && (
              <div className="text-sm">
                <span className="text-gray-500">Сарын түрээс: </span>
                {formatCurrency(unit.monthly_rent)}
              </div>
            )}
            {tenant && (
              <div className="text-sm">
                <span className="text-gray-500">Түрээслэгч: </span>
                {tenant.tenant_type === "company"
                  ? tenant.company_name
                  : tenant.name}
              </div>
            )}
            {lease && (
              <div className="text-sm">
                <span className="text-gray-500">Гэрээний хугацаа: </span>
                {new Date(lease.start_date).toLocaleDateString("mn-MN")}
                {lease.end_date &&
                  ` - ${new Date(lease.end_date).toLocaleDateString("mn-MN")}`}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
