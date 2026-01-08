"use client";

import { Button } from "@/components/ui/button";
import { FloorElementType, ElementDirection } from "@/types";
import {
  FloorElementIcon,
  ELEMENT_TYPE_LABELS,
  DIRECTION_LABELS,
} from "./FloorElementIcon";
import {
  DoorOpen,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

type PlacementMode = "select" | "move" | FloorElementType;

type ElementToolbarProps = {
  placementMode: PlacementMode;
  onPlacementModeChange: (mode: PlacementMode) => void;
  selectedDirection: ElementDirection;
  onDirectionChange: (direction: ElementDirection) => void;
};

const ELEMENT_TYPES: FloorElementType[] = ["door", "window", "stairs", "elevator"];
const DIRECTIONS: ElementDirection[] = ["north", "east", "south", "west"];

const DIRECTION_ICONS: Record<ElementDirection, typeof ArrowUp> = {
  north: ArrowUp,
  east: ArrowRight,
  south: ArrowDown,
  west: ArrowLeft,
};

export const ElementToolbar = ({
  placementMode,
  onPlacementModeChange,
  selectedDirection,
  onDirectionChange,
}: ElementToolbarProps) => {
  const isElementMode = ELEMENT_TYPES.includes(placementMode as FloorElementType);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-white p-2">
      {/* Element type buttons */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-gray-500">Элемент:</span>
        {ELEMENT_TYPES.map((type) => (
          <Button
            key={type}
            size="sm"
            variant={placementMode === type ? "default" : "outline"}
            onClick={() => onPlacementModeChange(type)}
            className="h-10 w-10 p-1"
            title={ELEMENT_TYPE_LABELS[type]}
          >
            <FloorElementIcon type={type} direction="north" size={24} />
          </Button>
        ))}
      </div>

      {/* Direction selector - only show when element mode is active */}
      {isElementMode && (
        <div className="flex items-center gap-1 border-l pl-2">
          <span className="mr-1 text-xs text-gray-500">Чиглэл:</span>
          {DIRECTIONS.map((dir) => {
            const Icon = DIRECTION_ICONS[dir];
            return (
              <Button
                key={dir}
                size="sm"
                variant={selectedDirection === dir ? "default" : "outline"}
                onClick={() => onDirectionChange(dir)}
                className="h-8 w-8 p-1"
                title={DIRECTION_LABELS[dir]}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type { PlacementMode };
