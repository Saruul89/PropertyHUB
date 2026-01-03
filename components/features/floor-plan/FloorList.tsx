"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Floor } from "@/types";
import { Layers, Trash2, Edit } from "lucide-react";

export interface FloorListProps {
  floors: Floor[];
  selectedFloorId?: string;
  onSelect: (floor: Floor) => void;
  onEdit?: (floor: Floor) => void;
  onDelete?: (floorId: string) => void;
  showActions?: boolean;
}

export function FloorList({
  floors,
  selectedFloorId,
  onSelect,
  onEdit,
  onDelete,
  showActions = false,
}: FloorListProps) {
  if (floors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Layers className="mb-4 h-12 w-12 text-gray-400" />
          <p className="text-gray-500">Давхарが登録されていません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {floors
        .sort((a, b) => a.floor_number - b.floor_number)
        .map((floor) => {
          const isSelected = floor.id === selectedFloorId;
          const displayName = floor.name || `${floor.floor_number}F`;

          return (
            <div
              key={floor.id}
              className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => onSelect(floor)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-full p-2 ${
                    isSelected ? "bg-primary/10" : "bg-gray-100"
                  }`}
                >
                  <Layers
                    className={`h-4 w-4 ${
                      isSelected ? "text-primary" : "text-gray-500"
                    }`}
                  />
                </div>
                <div>
                  <div className="font-medium">{displayName}</div>
                  <div className="text-xs text-gray-500">
                    {floor.plan_width || 800}x{floor.plan_height || 600}px
                  </div>
                </div>
              </div>

              {showActions && (
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(floor);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(floor.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}
