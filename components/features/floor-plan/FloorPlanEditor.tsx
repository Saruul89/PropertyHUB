"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloorSelector } from "./FloorSelector";
import { FloorPlanLegend } from "./FloorPlanLegend";
import { createClient } from "@/lib/supabase/client";
import { Floor, Unit } from "@/types";
import { UNIT_STATUS_LABELS } from "@/lib/constants";
import {
  Plus,
  Layers,
  Trash2,
  Move,
  Square,
  Eye,
  Grid3X3,
  Users,
  Save,
} from "lucide-react";

interface FloorWithUnits extends Floor {
  units: Unit[];
}

interface FloorPlanEditorProps {
  propertyId: string;
  propertyName: string;
}

const GRID_SIZE = 10;

export function FloorPlanEditor({
  propertyId,
  propertyName,
}: FloorPlanEditorProps) {
  const router = useRouter();
  const [floors, setFloors] = useState<FloorWithUnits[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState<"select" | "move">("select");
  const [gridSnap, setGridSnap] = useState(true);
  const [planDimensions, setPlanDimensions] = useState({
    width: 800,
    height: 600,
  });

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: floorsData } = await supabase
      .from("floors")
      .select("*")
      .eq("property_id", propertyId)
      .order("floor_number", { ascending: true });

    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId);

    const floorsWithUnits: FloorWithUnits[] = (floorsData || []).map(
      (floor: Floor) => ({
        ...floor,
        units: (unitsData || []).filter(
          (unit: Unit) => unit.floor_id === floor.id
        ),
      })
    );

    setFloors(floorsWithUnits);
    if (floorsWithUnits.length > 0) {
      setSelectedFloorId(floorsWithUnits[0].id);
      if (floorsWithUnits[0].plan_width && floorsWithUnits[0].plan_height) {
        setPlanDimensions({
          width: floorsWithUnits[0].plan_width,
          height: floorsWithUnits[0].plan_height,
        });
      }
    }
    setLoading(false);
  };

  const snapToGrid = (value: number) => {
    if (!gridSnap) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const handleAddFloor = async () => {
    const supabase = createClient();
    const newFloorNumber = floors.length + 1;

    const { data, error } = await supabase
      .from("floors")
      .insert({
        property_id: propertyId,
        floor_number: newFloorNumber,
        name: `${newFloorNumber}F`,
        plan_width: planDimensions.width,
        plan_height: planDimensions.height,
      })
      .select()
      .single();

    if (!error && data) {
      setFloors([...floors, { ...data, units: [] }]);
      setSelectedFloorId(data.id);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm("このДавхарを削除しますか？関連するユニットも削除されます。"))
      return;

    const supabase = createClient();
    await supabase.from("floors").delete().eq("id", floorId);

    const newFloors = floors.filter((f) => f.id !== floorId);
    setFloors(newFloors);
    if (selectedFloorId === floorId) {
      setSelectedFloorId(newFloors.length > 0 ? newFloors[0].id : null);
    }
  };

  const handleAddUnit = async () => {
    if (!selectedFloorId) return;

    const supabase = createClient();
    const floor = floors.find((f) => f.id === selectedFloorId);
    if (!floor) return;

    const unitCount = floor.units.length;
    const unitNumber = `${floor.floor_number}${String(unitCount + 1).padStart(
      2,
      "0"
    )}`;

    const { data, error } = await supabase
      .from("units")
      .insert({
        property_id: propertyId,
        floor_id: selectedFloorId,
        unit_number: unitNumber,
        floor: floor.floor_number,
        position_x: snapToGrid(50 + (unitCount % 4) * 150),
        position_y: snapToGrid(50 + Math.floor(unitCount / 4) * 120),
        width: 120,
        height: 100,
        status: "vacant",
        monthly_rent: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setFloors(
        floors.map((f) =>
          f.id === selectedFloorId ? { ...f, units: [...f.units, data] } : f
        )
      );
      setSelectedUnit(data);
    }
  };

  const handleUnitUpdate = async (unitId: string, updates: Partial<Unit>) => {
    const supabase = createClient();
    await supabase.from("units").update(updates).eq("id", unitId);

    setFloors(
      floors.map((floor) => ({
        ...floor,
        units: floor.units.map((unit) =>
          unit.id === unitId ? { ...unit, ...updates } : unit
        ),
      }))
    );

    if (selectedUnit?.id === unitId) {
      setSelectedUnit({ ...selectedUnit, ...updates });
    }
  };

  const handleUnitDrag = useCallback(
    (unitId: string, x: number, y: number) => {
      handleUnitUpdate(unitId, {
        position_x: snapToGrid(x),
        position_y: snapToGrid(y),
      });
    },
    [gridSnap]
  );

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("このユニットを削除しますか？")) return;

    const supabase = createClient();
    await supabase.from("units").delete().eq("id", unitId);

    setFloors(
      floors.map((floor) => ({
        ...floor,
        units: floor.units.filter((unit) => unit.id !== unitId),
      }))
    );
    setSelectedUnit(null);
  };

  const currentFloor = floors.find((f) => f.id === selectedFloorId);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={editMode === "select" ? "default" : "outline"}
            onClick={() => setEditMode("select")}
          >
            <Square className="h-4 w-4 mr-1" />
            選択
          </Button>
          <Button
            size="sm"
            variant={editMode === "move" ? "default" : "outline"}
            onClick={() => setEditMode("move")}
          >
            <Move className="h-4 w-4 mr-1" />
            移動
          </Button>
          <Button
            size="sm"
            variant={gridSnap ? "default" : "outline"}
            onClick={() => setGridSnap(!gridSnap)}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            グリッド
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              router.push(`/dashboard/properties/${propertyId}/floor-plan`)
            }
          >
            <Eye className="h-4 w-4 mr-1" />
            閲覧モード
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Floor List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Давхар一覧
              </span>
              <Button size="sm" variant="outline" onClick={handleAddFloor}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {floors.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  Давхарがありません
                </p>
              ) : (
                floors.map((floor) => (
                  <div
                    key={floor.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      selectedFloorId === floor.id
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <button
                      className="flex-1 text-left"
                      onClick={() => setSelectedFloorId(floor.id)}
                    >
                      <div className="font-medium">
                        {floor.name || `${floor.floor_number}F`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {floor.units.length} ユニット
                      </div>
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFloor(floor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Floor Plan Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>
                {currentFloor
                  ? `${
                      currentFloor.name || `${currentFloor.floor_number}F`
                    } のレイアウト`
                  : "フロアを選択"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddUnit}
                disabled={!selectedFloorId}
              >
                <Plus className="mr-1 h-4 w-4" />
                ユニット追加
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentFloor ? (
              <div
                className="relative overflow-auto rounded-lg border bg-gray-50"
                style={{
                  width: "100%",
                  height: "500px",
                }}
              >
                <div
                  className="relative"
                  style={{
                    width: currentFloor.plan_width || planDimensions.width,
                    height: currentFloor.plan_height || planDimensions.height,
                    minWidth: "100%",
                    minHeight: "100%",
                    backgroundImage: currentFloor.plan_image_url
                      ? `url(${currentFloor.plan_image_url})`
                      : gridSnap
                      ? "radial-gradient(circle, #ddd 1px, transparent 1px)"
                      : undefined,
                    backgroundSize: gridSnap
                      ? `${GRID_SIZE}px ${GRID_SIZE}px`
                      : "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {currentFloor.units.map((unit) => (
                    <div
                      key={unit.id}
                      className={`absolute cursor-pointer rounded border-2 transition-colors ${
                        selectedUnit?.id === unit.id
                          ? "border-blue-500 bg-blue-100"
                          : unit.status === "occupied"
                          ? "border-green-400 bg-green-50"
                          : unit.status === "maintenance"
                          ? "border-yellow-400 bg-yellow-50"
                          : unit.status === "reserved"
                          ? "border-purple-400 bg-purple-50"
                          : "border-gray-300 bg-white"
                      }`}
                      style={{
                        left: unit.position_x || 0,
                        top: unit.position_y || 0,
                        width: unit.width || 100,
                        height: unit.height || 80,
                      }}
                      onClick={() => setSelectedUnit(unit)}
                      draggable={editMode === "move"}
                      onDragEnd={(e) => {
                        if (editMode === "move") {
                          const rect =
                            e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            const x =
                              e.clientX - rect.left - (unit.width || 100) / 2;
                            const y =
                              e.clientY - rect.top - (unit.height || 80) / 2;
                            handleUnitDrag(
                              unit.id,
                              Math.max(0, x),
                              Math.max(0, y)
                            );
                          }
                        }
                      }}
                    >
                      <div className="flex h-full flex-col items-center justify-center p-2">
                        <span className="text-sm font-bold">
                          {unit.unit_number}
                        </span>
                        <span className="text-xs text-gray-500">
                          {unit.area_sqm ? `${unit.area_sqm}m²` : ""}
                        </span>
                        {unit.status === "occupied" && (
                          <Users className="mt-1 h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                Давхарを選択してください
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Details */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">ユニット詳細</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUnit ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit_number">ユニット番号</Label>
                  <Input
                    id="unit_number"
                    value={selectedUnit.unit_number}
                    onChange={(e) =>
                      handleUnitUpdate(selectedUnit.id, {
                        unit_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="area_sqm">Талбай (m²)</Label>
                  <Input
                    id="area_sqm"
                    type="number"
                    value={selectedUnit.area_sqm || ""}
                    onChange={(e) =>
                      handleUnitUpdate(selectedUnit.id, {
                        area_sqm: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_rent">Сарын түрээс</Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    value={selectedUnit.monthly_rent || ""}
                    onChange={(e) =>
                      handleUnitUpdate(selectedUnit.id, {
                        monthly_rent: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width">幅 (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={selectedUnit.width || 100}
                      onChange={(e) =>
                        handleUnitUpdate(selectedUnit.id, {
                          width: parseInt(e.target.value) || 100,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">高さ (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={selectedUnit.height || 80}
                      onChange={(e) =>
                        handleUnitUpdate(selectedUnit.id, {
                          height: parseInt(e.target.value) || 80,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="position_x">X座標</Label>
                    <Input
                      id="position_x"
                      type="number"
                      value={selectedUnit.position_x || 0}
                      onChange={(e) =>
                        handleUnitUpdate(selectedUnit.id, {
                          position_x: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="position_y">Y座標</Label>
                    <Input
                      id="position_y"
                      type="number"
                      value={selectedUnit.position_y || 0}
                      onChange={(e) =>
                        handleUnitUpdate(selectedUnit.id, {
                          position_y: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Статус</Label>
                  <select
                    className="mt-1 w-full rounded-md border p-2"
                    value={selectedUnit.status}
                    onChange={(e) =>
                      handleUnitUpdate(selectedUnit.id, {
                        status: e.target.value as Unit["status"],
                      })
                    }
                  >
                    <option value="vacant">Сул өрөө</option>
                    <option value="occupied">Эзэмшигчтэй</option>
                    <option value="maintenance">Засвартай中</option>
                    <option value="reserved">Захиалсан</option>
                  </select>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteUnit(selectedUnit.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ユニットを削除
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                ユニットを選択してзасах
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <FloorPlanLegend />
    </div>
  );
}
