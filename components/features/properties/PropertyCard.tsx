"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Settings, Trash2, Layers } from "lucide-react";
import { PROPERTY_TYPE_LABELS } from "@/lib/constants";
import type { Property } from "@/types";

type PropertyCardProps = {
  property: Property;
  onDelete?: (id: string) => void;
};

export function PropertyCard({ property, onDelete }: PropertyCardProps) {
  const handleDelete = () => {
    if (onDelete && confirm("Энэ барилгыг устгахдаа итгэлтэй байна уу?")) {
      onDelete(property.id);
    }
  };

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                property.property_type === "apartment"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </span>
            <CardTitle className="line-clamp-1 text-lg">
              {property.name}
            </CardTitle>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate">{property.address}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-gray-400" />
              <span>{property.total_floors} давхар</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Home className="h-4 w-4 text-gray-400" />
              <span>{property.total_units} өрөө</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/properties/${property.id}`}
            className="flex-1"
          >
            <Button variant="default" size="sm" className="w-full">
              <Home className="mr-1.5 h-4 w-4" />
              Өрөө удирдах
            </Button>
          </Link>
          <Link href={`/dashboard/properties/${property.id}/units`}>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
