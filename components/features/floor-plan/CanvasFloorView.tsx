"use client";

import { Users } from "lucide-react";
import { ResponsiveTooltip } from "./ResponsiveTooltip";
import { UnitTooltipContent, UnitWithDetails } from "./UnitTooltipContent";
import { FloorElementIcon } from "./FloorElementIcon";
import { UNIT_STATUS_FLOOR_PLAN_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Floor, FloorElementData } from "@/types";

type CanvasFloorViewProps = {
  floor: Floor;
  units: UnitWithDetails[];
  propertyId: string;
  className?: string;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("mn-MN").format(amount) + "₮";
};

export const CanvasFloorView = ({
  floor,
  units,
  propertyId,
  className,
}: CanvasFloorViewProps) => {
  const elements = floor.elements || [];

  return (
    <div
      className={cn(
        "relative overflow-auto bg-gray-50 rounded-lg border",
        "min-h-[300px] h-[50vh] md:h-[500px] lg:h-[600px]",
        className
      )}
    >
      <div
        className="relative"
        style={{
          width: floor.plan_width || 800,
          height: floor.plan_height || 600,
          minWidth: "100%",
          minHeight: "100%",
          backgroundImage: floor.plan_image_url
            ? `url(${floor.plan_image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Units with position */}
        {units.map((unit) => (
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
                "absolute rounded-lg border-2 p-2 cursor-pointer transition-all",
                "hover:shadow-lg hover:z-20",
                "flex flex-col items-center justify-center text-center",
                UNIT_STATUS_FLOOR_PLAN_COLORS[unit.status]
              )}
              style={{
                left: unit.position_x || 0,
                top: unit.position_y || 0,
                width: unit.width || 120,
                height: unit.height || 100,
              }}
            >
              <span className="text-lg font-bold">{unit.unit_number}</span>
              {unit.area_sqm && (
                <span className="text-xs text-gray-600">{unit.area_sqm}m²</span>
              )}
              {unit.status === "occupied" && (
                <Users className="h-4 w-4 text-green-600 mt-1" />
              )}
            </div>
          </ResponsiveTooltip>
        ))}

        {/* Floor Elements (doors, windows, stairs, elevators) */}
        {elements.map((element: FloorElementData) => (
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
  );
};
