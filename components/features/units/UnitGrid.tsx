"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UNIT_STATUS_COLORS, UNIT_STATUS_LABELS } from "@/lib/constants";
import type { Unit, UnitStatus } from "@/types";

interface UnitGridProps {
  units: Unit[];
  propertyId: string;
  onUnitClick?: (unit: Unit) => void;
}

export function UnitGrid({ units, propertyId, onUnitClick }: UnitGridProps) {
  // Давхарごとにグループ化
  const floorGroups = useMemo(() => {
    const groups = new Map<number, Unit[]>();

    units.forEach((unit) => {
      const floor = unit.floor || 1;
      if (!groups.has(floor)) {
        groups.set(floor, []);
      }
      groups.get(floor)!.push(unit);
    });

    // Давхар番号でソートして配列に変換（降順 = 上のДавхарから）
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([floor, floorUnits]) => ({
        floor,
        units: floorUnits.sort((a, b) =>
          a.unit_number.localeCompare(b.unit_number)
        ),
      }));
  }, [units]);

  const statusColors: Record<UnitStatus, string> = {
    vacant: "bg-blue-500 hover:bg-blue-600",
    occupied: "bg-green-500 hover:bg-green-600",
    maintenance: "bg-yellow-500 hover:bg-yellow-600",
    reserved: "bg-purple-500 hover:bg-purple-600",
  };

  return (
    <div className="space-y-4">
      {/* Тайлбар */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-gray-50 p-3">
        <span className="text-sm font-medium text-gray-600">Тайлбар:</span>
        {(
          ["vacant", "occupied", "maintenance", "reserved"] as UnitStatus[]
        ).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("h-4 w-4 rounded", statusColors[status])} />
            <span className="text-sm text-gray-600">
              {UNIT_STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>

      {/* Давхарごとのグリッド */}
      <div className="space-y-3 rounded-lg border bg-white p-4">
        {floorGroups.map(({ floor, units: floorUnits }) => (
          <div key={floor} className="flex items-center gap-4">
            <div className="w-12 text-right text-sm font-medium text-gray-600">
              {floor}Давхар
            </div>
            <div className="flex flex-wrap gap-2">
              {floorUnits.map((unit) => {
                const content = (
                  <div
                    className={cn(
                      "flex h-12 min-w-[60px] cursor-pointer flex-col items-center justify-center rounded px-2 text-white transition-colors",
                      statusColors[unit.status]
                    )}
                    onClick={() => onUnitClick?.(unit)}
                  >
                    <span className="text-sm font-medium">
                      {unit.unit_number}
                    </span>
                    {unit.area_sqm && (
                      <span className="text-xs opacity-80">
                        {unit.area_sqm}m²
                      </span>
                    )}
                  </div>
                );

                if (onUnitClick) {
                  return <div key={unit.id}>{content}</div>;
                }

                return (
                  <Link
                    key={unit.id}
                    href={`/dashboard/properties/${propertyId}/units/${unit.id}`}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
