"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { UnitStatusBadge } from "./UnitStatusBadge";
import type { Unit } from "@/types";

interface UnitCardProps {
  unit: Unit;
  propertyId: string;
  onEdit?: (unit: Unit) => void;
  onDelete?: (id: string) => void;
}

export function UnitCard({
  unit,
  propertyId,
  onEdit,
  onDelete,
}: UnitCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm("この部屋を削除しますか？")) {
      onDelete(unit.id);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{unit.unit_number}</h3>
            {unit.floor && (
              <p className="text-sm text-gray-500">{unit.floor}Давхар</p>
            )}
          </div>
          <UnitStatusBadge status={unit.status} />
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          {unit.area_sqm && <p>Талбай: {unit.area_sqm}m²</p>}
          {unit.rooms && <p>Өрөөний тоо: {unit.rooms}</p>}
          <p className="font-medium text-gray-900">
            ₮{unit.monthly_rent.toLocaleString()}/月
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onEdit(unit)}
            >
              <Pencil className="mr-1 h-3 w-3" />
              засах
            </Button>
          ) : (
            <Link
              href={`/dashboard/properties/${propertyId}/units/${unit.id}`}
              className="flex-1"
            >
              <Button variant="outline" size="sm" className="w-full">
                <Pencil className="mr-1 h-3 w-3" />
                詳細
              </Button>
            </Link>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
