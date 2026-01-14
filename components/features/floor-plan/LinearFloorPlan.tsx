"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FloorTabNavigation } from "./FloorTabNavigation";
import { FloorStatisticsCards } from "./FloorStatisticsCards";
import { CanvasFloorView } from "./CanvasFloorView";
import { GridFloorView } from "./GridFloorView";
import { FloorPlanLegend } from "./FloorPlanLegend";
import type { UnitWithDetails } from "./UnitTooltipContent";
import type { Floor } from "@/types";
import { cn } from "@/lib/utils";

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

export { UnitWithDetails };

export const LinearFloorPlan = ({
  propertyId,
  floors,
  selectedFloorId,
  onFloorSelect,
}: LinearFloorPlanProps) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentFloor = floors.find((f) => f.id === selectedFloorId);

  // Trigger transition animation when floor changes
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 200);
    return () => clearTimeout(timer);
  }, [selectedFloorId]);

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

  // Check if floor has position data
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
      {/* Floor Selection Tabs */}
      <FloorTabNavigation
        floors={floors}
        selectedFloorId={selectedFloorId}
        onFloorSelect={onFloorSelect}
      />

      {/* Statistics Summary */}
      <FloorStatisticsCards
        totalUnits={currentFloor?.units.length || 0}
        totalArea={totalArea}
        statusCounts={statusCounts}
      />

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
          <div
            className={cn(
              "transition-all duration-200",
              isTransitioning && "opacity-0 translate-y-2"
            )}
          >
            {currentFloor && hasPositionData ? (
              <CanvasFloorView
                floor={currentFloor}
                units={currentFloor.units}
                propertyId={propertyId}
              />
            ) : currentFloor ? (
              <GridFloorView
                units={currentFloor.units}
                propertyId={propertyId}
              />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                Давхар сонгоно уу
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <FloorPlanLegend />
    </div>
  );
};
