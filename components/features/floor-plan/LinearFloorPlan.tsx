"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloorPlanLegend } from "./FloorPlanLegend";
import { FloorElementIcon } from "./FloorElementIcon";
import { Unit, Tenant, Lease, Floor } from "@/types";
import { UNIT_STATUS_LABELS } from "@/lib/constants";
import { Users, ExternalLink, Grid3X3, FileText } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UnitWithDetails = Unit & {
  tenant?: Tenant | null;
  lease?: Lease | null;
};

type FloorWithUnits = Floor & {
  units: UnitWithDetails[];
};

type LinearFloorPlanProps = {
  propertyId: string;
  propertyName: string;
  floors: FloorWithUnits[];
  selectedFloorId: string | null;
  onFloorSelect: (floorId: string) => void;
};

const STATUS_COLORS = {
  vacant: "bg-blue-50 border-blue-400 hover:bg-blue-100",
  occupied: "bg-green-50 border-green-400 hover:bg-green-100",
  maintenance: "bg-yellow-50 border-yellow-400 hover:bg-yellow-100",
  reserved: "bg-purple-50 border-purple-400 hover:bg-purple-100",
};

// Tooltip content component for unit details
function UnitTooltipContent({
  unit,
  propertyId,
  formatCurrency,
}: {
  unit: UnitWithDetails;
  propertyId: string;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <div className="p-3 space-y-2">
      <div className="font-bold text-base border-b pb-2">
        {unit.unit_number}
      </div>
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
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
        >
          <Grid3X3 className="h-3 w-3" />
          Өрөөний дэлгэрэнгүй
          <ExternalLink className="h-3 w-3" />
        </Link>
        {unit.tenant && (
          <Link
            href={`/dashboard/tenants/${unit.tenant.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <Users className="h-3 w-3" />
            Түрээслэгч харах
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
        {unit.lease && (
          <Link
            href={`/dashboard/leases/${unit.lease.id}`}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
          >
            <FileText className="h-3 w-3" />
            Гэрээ харах
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export function LinearFloorPlan({
  propertyId,
  floors,
  selectedFloorId,
  onFloorSelect,
}: LinearFloorPlanProps) {
  const currentFloor = floors.find((f) => f.id === selectedFloorId);

  const totalArea = useMemo(() => {
    if (!currentFloor) return 0;
    return currentFloor.units.reduce((sum, u) => sum + (u.area_sqm || 0), 0);
  }, [currentFloor]);

  const statusCounts = useMemo(() => {
    if (!currentFloor)
      return { vacant: 0, occupied: 0, maintenance: 0, reserved: 0 };
    return currentFloor.units.reduce(
      (acc, u) => {
        acc[u.status]++;
        return acc;
      },
      { vacant: 0, occupied: 0, maintenance: 0, reserved: 0 }
    );
  }, [currentFloor]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
  };

  // Check if floor has position data (at least one unit with position_x > 0 or position_y > 0)
  const hasPositionData = useMemo(() => {
    if (!currentFloor) return false;
    return currentFloor.units.some(
      (unit) =>
        (unit.position_x && unit.position_x > 0) ||
        (unit.position_y && unit.position_y > 0)
    );
  }, [currentFloor]);

  return (
    <div className="space-y-4">
      {/* Header - Floor Selection Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const container = document.getElementById("floor-scroll-container");
            container?.scrollBy({ left: -200, behavior: "smooth" });
          }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
        >
          ‹
        </button>

        <div
          id="floor-scroll-container"
          className="flex gap-2 overflow-x-scroll pb-2 flex-1"
        >
          {floors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => onFloorSelect(floor.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                selectedFloorId === floor.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {floor.name || `${floor.floor_number}F`}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            const container = document.getElementById("floor-scroll-container");
            container?.scrollBy({ left: 200, behavior: "smooth" });
          }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
        >
          ›
        </button>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-3">
          <div className="text-sm text-gray-500">Нийт өрөө</div>
          <div className="text-xl font-bold">
            {currentFloor?.units.length || 0}
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm text-gray-500">Нийт талбай</div>
          <div className="text-xl font-bold">{totalArea.toFixed(1)}m²</div>
        </Card>
        <Card className="p-3 border-blue-200 bg-blue-50">
          <div className="text-sm text-blue-600">Сул өрөө</div>
          <div className="text-xl font-bold text-blue-700">
            {statusCounts.vacant}
          </div>
        </Card>
        <Card className="p-3 border-green-200 bg-green-50">
          <div className="text-sm text-green-600">Эзэмшигчтэй</div>
          <div className="text-xl font-bold text-green-700">
            {statusCounts.occupied}
          </div>
        </Card>
        <Card className="p-3 border-yellow-200 bg-yellow-50">
          <div className="text-sm text-yellow-600">Засвартай</div>
          <div className="text-xl font-bold text-yellow-700">
            {statusCounts.maintenance}
          </div>
        </Card>
      </div>

      {/* Floor Plan Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              {currentFloor?.name || `${currentFloor?.floor_number}F`}
            </span>
            <span className="text-sm font-normal text-gray-500">
              {currentFloor?.units.length || 0} өрөө
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentFloor && hasPositionData ? (
            /* Visual Canvas View - when position data exists */
            <div
              className="relative overflow-auto bg-gray-50 rounded-lg border"
              style={{ height: "500px" }}
            >
              <div
                className="relative"
                style={{
                  width: currentFloor.plan_width || 800,
                  height: currentFloor.plan_height || 600,
                  minWidth: "100%",
                  minHeight: "100%",
                  backgroundImage: currentFloor.plan_image_url
                    ? `url(${currentFloor.plan_image_url})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Units with position */}
                {currentFloor.units.map((unit) => (
                  <TooltipProvider key={unit.id}>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            absolute rounded-lg border-2 p-2 cursor-pointer transition-all
                            hover:shadow-lg hover:z-20
                            flex flex-col items-center justify-center text-center
                            ${STATUS_COLORS[unit.status]}
                          `}
                          style={{
                            left: unit.position_x || 0,
                            top: unit.position_y || 0,
                            width: unit.width || 120,
                            height: unit.height || 100,
                          }}
                        >
                          <span className="text-lg font-bold">
                            {unit.unit_number}
                          </span>
                          {unit.area_sqm && (
                            <span className="text-xs text-gray-600">
                              {unit.area_sqm}m²
                            </span>
                          )}
                          {unit.status === "occupied" && (
                            <Users className="h-4 w-4 text-green-600 mt-1" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="p-0 w-64 z-50">
                        <UnitTooltipContent
                          unit={unit}
                          propertyId={propertyId}
                          formatCurrency={formatCurrency}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

                {/* Floor Elements (doors, windows, stairs, elevators) */}
                {currentFloor.elements?.map((element) => (
                  <div
                    key={element.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: element.position_x,
                      top: element.position_y,
                      width: element.width || 40,
                      height: element.height || 40,
                      zIndex: 10,
                    }}
                  >
                    <FloorElementIcon
                      type={element.element_type}
                      direction={element.direction}
                      size={element.width || 40}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : currentFloor ? (
            /* Grid View - when no position data */
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg min-h-[200px]">
              {currentFloor.units
                .slice()
                .sort((a, b) => a.unit_number.localeCompare(b.unit_number))
                .map((unit) => (
                  <TooltipProvider key={unit.id}>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            rounded-lg border-2 p-3 cursor-pointer transition-all
                            hover:shadow-md hover:scale-105
                            flex flex-col items-center justify-center text-center
                            min-w-[120px]
                            ${STATUS_COLORS[unit.status]}
                          `}
                        >
                          <span className="text-lg font-bold">
                            {unit.unit_number}
                          </span>
                          {unit.area_sqm && (
                            <span className="text-sm text-gray-600">
                              {unit.area_sqm}m²
                            </span>
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
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="p-0 w-64 z-50">
                        <UnitTooltipContent
                          unit={unit}
                          propertyId={propertyId}
                          formatCurrency={formatCurrency}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}

              {currentFloor.units.length === 0 && (
                <div className="w-full text-center py-12 text-gray-500">
                  Өрөө бүртгэгдээгүй байна
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              Өрөө бүртгэгдээгүй байна
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <FloorPlanLegend />
    </div>
  );
}
