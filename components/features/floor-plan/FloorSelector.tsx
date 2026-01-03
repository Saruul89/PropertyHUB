"use client";

import { cn } from "@/lib/utils";
import { Floor } from "@/types";

interface FloorSelectorProps {
  floors: Floor[];
  selectedFloorId: string | null;
  onSelect: (floorId: string) => void;
}

export function FloorSelector({
  floors,
  selectedFloorId,
  onSelect,
}: FloorSelectorProps) {
  if (floors.length === 0) {
    return <div className="text-sm text-gray-500 py-2">Давхарがありません</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {floors.map((floor) => (
        <button
          key={floor.id}
          onClick={() => onSelect(floor.id)}
          className={cn(
            "px-4 py-2 rounded-lg font-medium transition-colors text-sm",
            selectedFloorId === floor.id
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {floor.name || `${floor.floor_number}F`}
        </button>
      ))}
    </div>
  );
}
