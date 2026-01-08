"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LinearFloorPlan } from "@/components/features/floor-plan/LinearFloorPlan";
import { useCompany, useFloorPlanProperties, useFloorPlanData } from "@/hooks";
import { Building2, Map, Layers, LayoutList, Pencil, Home, Building2Icon, Layers2 } from "lucide-react";

type ViewType = "list" | "linear";

export default function FloorPlansPage() {
  const router = useRouter();
  const { company } = useCompany();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null
  );
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>("linear");
  const [initialized, setInitialized] = useState(false);

  // キャッシュ付きデータ取得
  const { data: properties = [], isLoading: propertiesLoading } =
    useFloorPlanProperties(company?.id);

  const { data: floorData, isLoading: floorDataLoading } =
    useFloorPlanData(selectedPropertyId);

  const floors = floorData?.floors || [];

  const floorPlanEnabledProperties = properties.filter(
    (p) => p.floor_plan_enabled
  );

  // 初回ロード時に最初のフロアプラン有効なビルを自動選択
  useEffect(() => {
    if (
      !initialized &&
      floorPlanEnabledProperties.length > 0 &&
      !selectedPropertyId
    ) {
      setSelectedPropertyId(floorPlanEnabledProperties[0].id);
      setViewType("linear");
      setInitialized(true);
    }
  }, [floorPlanEnabledProperties, selectedPropertyId, initialized]);

  // 物件選択時にフロアを初期選択
  useEffect(() => {
    if (floors.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floors[0].id);
    } else if (floors.length === 0) {
      setSelectedFloorId(null);
    }
  }, [floors, selectedFloorId]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  const isLoading =
    propertiesLoading || (selectedPropertyId && floorDataLoading);

  if (propertiesLoading) {
    return (
      <>
        <Header title="Давхрын зураг" />
        <div className="flex h-64 items-center justify-center">
          <div className="text-gray-500">Ачааллаж байна...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Давхрын зураг" />
      <div className="p-6 space-y-6">
        {/* Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Property Selector */}
            {floorPlanEnabledProperties.length > 0 && (
              <Select
                value={selectedPropertyId || ""}
                onValueChange={(value) => {
                  setSelectedPropertyId(value);
                  setSelectedFloorId(null); // フロア選択をリセット
                  if (viewType === "list") {
                    setViewType("linear");
                  }
                }}
              >
                <SelectTrigger className="w-[280px]">
                  <Building2 className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Барилга сонгох" />
                </SelectTrigger>
                <SelectContent>
                  {floorPlanEnabledProperties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg border p-1">
              <Button
                size="sm"
                variant={viewType === "list" ? "default" : "ghost"}
                onClick={() => {
                  setViewType("list");
                  setSelectedPropertyId(null);
                }}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Жагсаалт
              </Button>
              {selectedPropertyId && (
                <Button
                  size="sm"
                  variant={viewType === "linear" ? "default" : "ghost"}
                  onClick={() => setViewType("linear")}
                  className="gap-2"
                >
                  <LayoutList className="h-4 w-4" />
                  Нэг мөрөнд
                </Button>
              )}
            </div>

            {selectedPropertyId && (
              <Link href={`/dashboard/floor-plans/${selectedPropertyId}`}>
                <Button variant="outline" size="sm">
                  <Pencil className="mr-2 h-4 w-4" />
                  Давхарын зураг
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {viewType === "list" ? (
          // Property List View
          properties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-4 text-gray-500">Барилга байхгүй байна</p>
                <Button
                  onClick={() => router.push("/dashboard/properties/new")}
                >
                  Барилга бүртгэх
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Card
                  key={property.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${
                    !property.floor_plan_enabled ? "opacity-60" : ""
                  }`}
                  onClick={() => {
                    if (property.floor_plan_enabled) {
                      setSelectedPropertyId(property.id);
                      setSelectedFloorId(null);
                      setViewType("linear");
                    }
                  }}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      {property.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Layers2 className="h-4 w-4" />
                        <span>{property.total_floors} давхар</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        <span>{property.total_units} өрөө</span>
                      </div>
                      <div className="truncate text-gray-500">
                        {property.address}
                      </div>
                    </div>
                    <div className="mt-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          property.floor_plan_enabled
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {property.floor_plan_enabled
                          ? "Давхрын зураг идэвхтэй"
                          : "Давхрын зураг идэвхгүй"}
                      </span>
                    </div>
                    {!property.floor_plan_enabled && (
                      <Link
                        href={`/dashboard/floor-plans/${property.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 w-full"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Идэвхжүүлэх
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : floorDataLoading ? (
          // Loading floor data
          <div className="flex h-64 items-center justify-center">
            <div className="text-gray-500">Ачааллаж байна...</div>
          </div>
        ) : selectedPropertyId && floors.length === 0 ? (
          // No floors configured
          <Card>
            <CardContent className="py-12 text-center">
              <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 mb-4">
                {selectedProperty?.name} - Давхрын зураг тохируулагдаагүй байна
              </p>
              <Link href={`/dashboard/floor-plans/${selectedPropertyId}`}>
                <Button>
                  <Pencil className="mr-2 h-4 w-4" />
                  Давхрын зураг үүсгэх
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewType === "linear" && selectedPropertyId ? (
          // Linear Floor Plan View
          <LinearFloorPlan
            propertyId={selectedPropertyId}
            propertyName={selectedProperty?.name || ""}
            floors={floors}
            selectedFloorId={selectedFloorId}
            onFloorSelect={setSelectedFloorId}
          />
        ) : null}
      </div>
    </>
  );
}
