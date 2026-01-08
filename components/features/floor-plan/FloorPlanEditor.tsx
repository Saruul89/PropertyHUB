"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloorPlanLegend } from "./FloorPlanLegend";
import { FloorElementIcon } from "./FloorElementIcon";
import { ElementToolbar, PlacementMode } from "./ElementToolbar";
import { createClient } from "@/lib/supabase/client";
import {
  Floor,
  Unit,
  FloorElementData,
  ElementDirection,
  FloorElementType,
  FloorTemplate,
  TemplateUnit,
} from "@/types";
import {
  Plus,
  Layers,
  Trash2,
  Move,
  Square,
  Grid3X3,
  Users,
  Save,
  Loader2,
  FileCheck,
  Copy,
} from "lucide-react";

type FloorWithUnits = Floor & {
  units: Unit[];
};

type FloorPlanEditorProps = {
  propertyId: string;
};

const GRID_SIZE = 10;
const CANVAS_MAX_WIDTH = 600;
const CANVAS_MAX_HEIGHT = 700;
const MIN_UNIT_WIDTH = 1000;
const MIN_UNIT_HEIGHT = 30;

export function FloorPlanEditor({ propertyId }: FloorPlanEditorProps) {
  const [floors, setFloors] = useState<FloorWithUnits[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedElement, setSelectedElement] =
    useState<FloorElementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<"select" | "move">("select");
  const [placementMode, setPlacementMode] = useState<PlacementMode>("select");
  const [selectedDirection, setSelectedDirection] =
    useState<ElementDirection>("north");
  const [gridSnap, setGridSnap] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [resizing, setResizing] = useState<{
    unitId: string;
    corner: "se" | "sw" | "ne" | "nw";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  // Local state for pending changes
  const [localUnits, setLocalUnits] = useState<Record<string, Partial<Unit>>>(
    {}
  );
  const [deletedElementIds, setDeletedElementIds] = useState<string[]>([]);
  const [newElements, setNewElements] = useState<Omit<FloorElementData, "id">[]>(
    []
  );

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
      // Check if template exists
      const firstFloor = floorsWithUnits[0];
      setHasTemplate(!!firstFloor.template?.units?.length);
    }
    setLoading(false);
  };

  const snapToGrid = useCallback(
    (value: number) => {
      if (!gridSnap) return value;
      return Math.round(value / GRID_SIZE) * GRID_SIZE;
    },
    [gridSnap]
  );

  const currentFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloorId),
    [floors, selectedFloorId]
  );

  // Calculate grid positions for units without saved positions
  const getUnitsWithPositions = useCallback(
    (units: Unit[]) => {
      let gridIndex = 0;
      return units.map((unit) => {
        const localChanges = localUnits[unit.id] || {};
        const hasPosition =
          (unit.position_x !== null && unit.position_x !== undefined) ||
          localChanges.position_x !== undefined;

        if (!hasPosition) {
          const col = gridIndex % 4;
          const row = Math.floor(gridIndex / 4);
          gridIndex++;
          return {
            ...unit,
            ...localChanges,
            position_x: localChanges.position_x ?? 50 + col * 150,
            position_y: localChanges.position_y ?? 50 + row * 120,
            width: localChanges.width ?? unit.width ?? 120,
            height: localChanges.height ?? unit.height ?? 100,
          };
        }
        return {
          ...unit,
          ...localChanges,
          position_x: localChanges.position_x ?? unit.position_x ?? 0,
          position_y: localChanges.position_y ?? unit.position_y ?? 0,
          width: localChanges.width ?? unit.width ?? 120,
          height: localChanges.height ?? unit.height ?? 100,
        };
      });
    },
    [localUnits]
  );

  // Get all elements (saved + new)
  const getAllElements = useCallback((): FloorElementData[] => {
    if (!currentFloor) return [];
    const savedElements = (currentFloor.elements || []).filter(
      (el) => !deletedElementIds.includes(el.id)
    );
    const newElementsWithTempIds: FloorElementData[] = newElements.map(
      (el, idx) => ({
        ...el,
        id: `temp-${idx}`,
      })
    );
    return [...savedElements, ...newElementsWithTempIds];
  }, [currentFloor, deletedElementIds, newElements]);

  // Calculate scale factor
  const calculateScale = useCallback(() => {
    if (!currentFloor) return 1;

    const units = getUnitsWithPositions(currentFloor.units);
    const elements = getAllElements();

    let maxX = 0;
    let maxY = 0;

    units.forEach((unit) => {
      const right = (unit.position_x || 0) + (unit.width || 120);
      const bottom = (unit.position_y || 0) + (unit.height || 100);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    elements.forEach((el) => {
      const right = el.position_x + (el.width || 40);
      const bottom = el.position_y + (el.height || 40);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add padding
    maxX += 50;
    maxY += 50;

    const scaleX = CANVAS_MAX_WIDTH / maxX;
    const scaleY = CANVAS_MAX_HEIGHT / maxY;

    return Math.min(1, scaleX, scaleY);
  }, [currentFloor, getUnitsWithPositions, getAllElements]);

  const handleAddFloor = async () => {
    const supabase = createClient();
    const newFloorNumber = floors.length + 1;

    const { data, error } = await supabase
      .from("floors")
      .insert({
        property_id: propertyId,
        floor_number: newFloorNumber,
        name: `${newFloorNumber}F`,
        plan_width: CANVAS_MAX_WIDTH,
        plan_height: CANVAS_MAX_HEIGHT,
      })
      .select()
      .single();

    if (!error && data) {
      setFloors([...floors, { ...data, units: [], elements: [] }]);
      setSelectedFloorId(data.id);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm("Энэ давхрыг устгах уу? Холбогдох өрөөнүүд мөн устана."))
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

    const col = unitCount % 4;
    const row = Math.floor(unitCount / 4);

    const { data, error } = await supabase
      .from("units")
      .insert({
        property_id: propertyId,
        floor_id: selectedFloorId,
        unit_number: unitNumber,
        floor: floor.floor_number,
        position_x: snapToGrid(50 + col * 150),
        position_y: snapToGrid(50 + row * 120),
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

  const handleLocalUnitUpdate = (unitId: string, updates: Partial<Unit>) => {
    setLocalUnits((prev) => ({
      ...prev,
      [unitId]: { ...prev[unitId], ...updates },
    }));
    setHasUnsavedChanges(true);

    if (selectedUnit?.id === unitId) {
      setSelectedUnit({ ...selectedUnit, ...updates });
    }
  };

  const handleUnitDrag = useCallback(
    (unitId: string, x: number, y: number) => {
      handleLocalUnitUpdate(unitId, {
        position_x: snapToGrid(Math.max(0, x)),
        position_y: snapToGrid(Math.max(0, y)),
      });
    },
    [snapToGrid]
  );

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Энэ өрөөг устгах уу?")) return;

    const supabase = createClient();
    await supabase.from("units").delete().eq("id", unitId);

    setFloors(
      floors.map((floor) => ({
        ...floor,
        units: floor.units.filter((unit) => unit.id !== unitId),
      }))
    );
    setSelectedUnit(null);
    delete localUnits[unitId];
    setLocalUnits({ ...localUnits });
  };

  // Canvas click handler for element placement
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (placementMode === "select" || placementMode === "move") return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scale = calculateScale();
    const x = snapToGrid((e.clientX - rect.left) / scale);
    const y = snapToGrid((e.clientY - rect.top) / scale);

    if (!selectedFloorId) return;

    const newElement: Omit<FloorElementData, "id"> = {
      element_type: placementMode as FloorElementType,
      direction: selectedDirection,
      position_x: x - 20,
      position_y: y - 20,
      width: 40,
      height: 40,
    };

    setNewElements([...newElements, newElement]);
    setHasUnsavedChanges(true);
  };

  const handleElementDrag = (
    elementId: string,
    x: number,
    y: number,
    isNew: boolean,
    newIndex?: number
  ) => {
    if (isNew && newIndex !== undefined) {
      const updated = [...newElements];
      updated[newIndex] = {
        ...updated[newIndex],
        position_x: snapToGrid(Math.max(0, x)),
        position_y: snapToGrid(Math.max(0, y)),
      };
      setNewElements(updated);
    } else {
      setFloors(
        floors.map((floor) => ({
          ...floor,
          elements: (floor.elements || []).map((el) =>
            el.id === elementId
              ? {
                  ...el,
                  position_x: snapToGrid(Math.max(0, x)),
                  position_y: snapToGrid(Math.max(0, y)),
                }
              : el
          ),
        }))
      );
    }
    setHasUnsavedChanges(true);
  };

  const handleDeleteElement = (
    elementId: string,
    isNew: boolean,
    newIndex?: number
  ) => {
    if (isNew && newIndex !== undefined) {
      setNewElements(newElements.filter((_, idx) => idx !== newIndex));
    } else {
      setDeletedElementIds([...deletedElementIds, elementId]);
    }
    setSelectedElement(null);
    setHasUnsavedChanges(true);
  };

  // Resize handlers
  const handleResizeStart = (
    e: React.MouseEvent,
    unitId: string,
    corner: "se" | "sw" | "ne" | "nw"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const unit = currentFloor?.units.find((u) => u.id === unitId);
    if (!unit) return;

    const localChanges = localUnits[unitId] || {};
    setResizing({
      unitId,
      corner,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: localChanges.width ?? unit.width ?? 120,
      startHeight: localChanges.height ?? unit.height ?? 100,
      startPosX: localChanges.position_x ?? unit.position_x ?? 0,
      startPosY: localChanges.position_y ?? unit.position_y ?? 0,
    });
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing) return;

      const scale = calculateScale();
      const deltaX = (e.clientX - resizing.startX) / scale;
      const deltaY = (e.clientY - resizing.startY) / scale;

      let newWidth = resizing.startWidth;
      let newHeight = resizing.startHeight;
      let newPosX = resizing.startPosX;
      let newPosY = resizing.startPosY;

      switch (resizing.corner) {
        case "se":
          newWidth = Math.max(MIN_UNIT_WIDTH, resizing.startWidth + deltaX);
          newHeight = Math.max(MIN_UNIT_HEIGHT, resizing.startHeight + deltaY);
          break;
        case "sw":
          newWidth = Math.max(MIN_UNIT_WIDTH, resizing.startWidth - deltaX);
          newHeight = Math.max(MIN_UNIT_HEIGHT, resizing.startHeight + deltaY);
          newPosX = resizing.startPosX + (resizing.startWidth - newWidth);
          break;
        case "ne":
          newWidth = Math.max(MIN_UNIT_WIDTH, resizing.startWidth + deltaX);
          newHeight = Math.max(MIN_UNIT_HEIGHT, resizing.startHeight - deltaY);
          newPosY = resizing.startPosY + (resizing.startHeight - newHeight);
          break;
        case "nw":
          newWidth = Math.max(MIN_UNIT_WIDTH, resizing.startWidth - deltaX);
          newHeight = Math.max(MIN_UNIT_HEIGHT, resizing.startHeight - deltaY);
          newPosX = resizing.startPosX + (resizing.startWidth - newWidth);
          newPosY = resizing.startPosY + (resizing.startHeight - newHeight);
          break;
      }

      handleLocalUnitUpdate(resizing.unitId, {
        width: snapToGrid(newWidth),
        height: snapToGrid(newHeight),
        position_x: snapToGrid(newPosX),
        position_y: snapToGrid(newPosY),
      });
    },
    [resizing, calculateScale, snapToGrid]
  );

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizing, handleResizeMove, handleResizeEnd]);

  // Save all changes
  const handleSave = async () => {
    if (!selectedFloorId || !hasUnsavedChanges) return;

    setSaving(true);
    try {
      const unitsToSave = Object.entries(localUnits).map(([id, changes]) => {
        const unit = currentFloor?.units.find((u) => u.id === id);
        return {
          id,
          position_x: changes.position_x ?? unit?.position_x ?? 0,
          position_y: changes.position_y ?? unit?.position_y ?? 0,
          width: changes.width ?? unit?.width ?? 120,
          height: changes.height ?? unit?.height ?? 100,
          // 追加フィールド
          unit_number: changes.unit_number ?? unit?.unit_number,
          area_sqm: changes.area_sqm ?? unit?.area_sqm,
          status: changes.status ?? unit?.status,
        };
      });

      const elementsToSave: FloorElementData[] = [
        ...(currentFloor?.elements || [])
          .filter((el) => !deletedElementIds.includes(el.id))
          .map((el) => ({
            id: el.id,
            element_type: el.element_type,
            direction: el.direction,
            position_x: el.position_x,
            position_y: el.position_y,
            width: el.width,
            height: el.height,
          })),
        ...newElements.map((el, idx) => ({
          id: `new-${idx}-${Date.now()}`,
          element_type: el.element_type,
          direction: el.direction,
          position_x: el.position_x,
          position_y: el.position_y,
          width: el.width,
          height: el.height,
        })),
      ];

      const response = await fetch(`/api/floors/${selectedFloorId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units: unitsToSave,
          elements: elementsToSave,
          deleted_element_ids: deletedElementIds,
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchData();
        setLocalUnits({});
        setNewElements([]);
        setDeletedElementIds([]);
        setHasUnsavedChanges(false);
        alert("Амжилттай хадгалагдлаа!");
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  // Save current layout as template
  const handleSaveTemplate = async () => {
    if (!currentFloor) return;
    if (!confirm("Одоогийн зохион байгуулалтыг загвар болгон хадгалах уу? Бүх давхарт ижил загвар хадгалагдана.")) return;

    setSavingTemplate(true);
    try {
      const displayedUnits = getUnitsWithPositions(currentFloor.units);
      const elements = getAllElements();

      const templateUnits: TemplateUnit[] = displayedUnits.map((unit, index) => ({
        position_x: unit.position_x ?? 0,
        position_y: unit.position_y ?? 0,
        width: unit.width ?? 120,
        height: unit.height ?? 100,
        relative_index: index + 1,
        area_sqm: unit.area_sqm,
      }));

      const response = await fetch(`/api/floors/template/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
          units: templateUnits,
          elements: elements,
        }),
      });

      if (response.ok) {
        setHasTemplate(true);
        alert("Загвар амжилттай хадгалагдлаа!");
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error}`);
      }
    } catch (error) {
      console.error("Template save error:", error);
      alert("Загвар хадгалахад алдаа гарлаа");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Apply template to all floors
  const handleApplyTemplate = async () => {
    if (!hasTemplate) {
      alert("Эхлээд загвар хадгална уу.");
      return;
    }
    if (!confirm("Загварыг бүх давхарт хэрэгжүүлэх үү? Датаны ихээс хамааран 2 минут хүртлэх хугацаа орохыг анхаарна уу. Одоогийн бүх өрөөнүүд устгагдаж, загварын дагуу шинээр үүснэ.")) return;

    setApplyingTemplate(true);
    try {
      const response = await fetch(`/api/floors/template/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        await fetchData();
        setLocalUnits({});
        setNewElements([]);
        setDeletedElementIds([]);
        setHasUnsavedChanges(false);
        alert(result.message);
      } else {
        const error = await response.json();
        alert(`Алдаа: ${error.error}`);
      }
    } catch (error) {
      console.error("Template apply error:", error);
      alert("Загвар хэрэгжүүлэхэд алдаа гарлаа");
    } finally {
      setApplyingTemplate(false);
    }
  };

  const scale = calculateScale();
  const displayUnits = currentFloor
    ? getUnitsWithPositions(currentFloor.units)
    : [];
  const displayElements = getAllElements();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={editMode === "select" ? "default" : "outline"}
            onClick={() => {
              setEditMode("select");
              setPlacementMode("select");
            }}
          >
            <Square className="h-4 w-4 mr-1" />
            Сонгох
          </Button>
          <Button
            size="sm"
            variant={editMode === "move" ? "default" : "outline"}
            onClick={() => {
              setEditMode("move");
              setPlacementMode("move");
            }}
          >
            <Move className="h-4 w-4 mr-1" />
            Зөөх
          </Button>
          <Button
            size="sm"
            variant={gridSnap ? "default" : "outline"}
            onClick={() => setGridSnap(!gridSnap)}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Торон шугам
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={hasUnsavedChanges ? "default" : "outline"}
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
            className={
              hasUnsavedChanges ? "bg-yellow-500 hover:bg-yellow-600" : ""
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Хадгалах
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveTemplate}
            disabled={savingTemplate || !currentFloor?.units?.length}
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            {savingTemplate ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-1" />
            )}
            Загвар хадгалах
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyTemplate}
            disabled={applyingTemplate || !hasTemplate}
            className="border-green-300 text-green-600 hover:bg-green-50"
          >
            {applyingTemplate ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-1" />
            )}
            Загвар ашиглах
          </Button>
        </div>
      </div>

      {/* Element Toolbar */}
      <ElementToolbar
        placementMode={placementMode}
        onPlacementModeChange={(mode) => {
          setPlacementMode(mode);
          if (mode !== "select" && mode !== "move") {
            setEditMode("select");
          }
        }}
        selectedDirection={selectedDirection}
        onDirectionChange={setSelectedDirection}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Floor List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Давхрууд
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
                  Давхар байхгүй байна
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
                      onClick={() => {
                        setSelectedFloorId(floor.id);
                        setSelectedUnit(null);
                        setSelectedElement(null);
                      }}
                    >
                      <div className="font-medium">
                        {floor.name || `${floor.floor_number}F`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {floor.units.length} өрөө,{" "}
                        {(floor.elements || []).length} элемент
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
                    } зохион байгуулалт`
                  : "Давхар сонгох"}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddUnit}
                disabled={!selectedFloorId}
              >
                <Plus className="mr-1 h-4 w-4" />
                Өрөө нэмэх
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentFloor ? (
              <div
                className="relative overflow-auto rounded-lg border bg-gray-50"
                style={{ width: "100%", height: "100%", minHeight: "500px", maxHeight: "70vh" }}
              >
                <div
                  className="relative origin-top-left"
                  style={{
                    width: CANVAS_MAX_WIDTH,
                    height: CANVAS_MAX_HEIGHT,
                    transform: `scale(${scale})`,
                    backgroundImage: gridSnap
                      ? "radial-gradient(circle, #ddd 1px, transparent 1px)"
                      : undefined,
                    backgroundSize: gridSnap
                      ? `${GRID_SIZE}px ${GRID_SIZE}px`
                      : undefined,
                  }}
                  onClick={handleCanvasClick}
                >
                  {/* Units */}
                  {displayUnits.map((unit) => (
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
                        left: unit.position_x,
                        top: unit.position_y,
                        width: unit.width,
                        height: unit.height,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUnit(unit);
                        setSelectedElement(null);
                      }}
                      draggable={editMode === "move"}
                      onDragEnd={(e) => {
                        if (editMode === "move") {
                          const rect =
                            e.currentTarget.parentElement?.getBoundingClientRect();
                          if (rect) {
                            const x =
                              (e.clientX - rect.left) / scale -
                              (unit.width || 120) / 2;
                            const y =
                              (e.clientY - rect.top) / scale -
                              (unit.height || 100) / 2;
                            handleUnitDrag(unit.id, x, y);
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

                      {/* Resize handles when selected */}
                      {selectedUnit?.id === unit.id && (
                        <>
                          <div
                            className="absolute -right-1 -bottom-1 h-3 w-3 cursor-se-resize rounded-full bg-blue-500"
                            onMouseDown={(e) =>
                              handleResizeStart(e, unit.id, "se")
                            }
                          />
                          <div
                            className="absolute -left-1 -bottom-1 h-3 w-3 cursor-sw-resize rounded-full bg-blue-500"
                            onMouseDown={(e) =>
                              handleResizeStart(e, unit.id, "sw")
                            }
                          />
                          <div
                            className="absolute -right-1 -top-1 h-3 w-3 cursor-ne-resize rounded-full bg-blue-500"
                            onMouseDown={(e) =>
                              handleResizeStart(e, unit.id, "ne")
                            }
                          />
                          <div
                            className="absolute -left-1 -top-1 h-3 w-3 cursor-nw-resize rounded-full bg-blue-500"
                            onMouseDown={(e) =>
                              handleResizeStart(e, unit.id, "nw")
                            }
                          />
                        </>
                      )}
                    </div>
                  ))}

                  {/* Elements */}
                  {displayElements.map((element) => {
                    const isNew = element.id.startsWith("temp-");
                    const newIndex = isNew
                      ? parseInt(element.id.replace("temp-", ""))
                      : undefined;

                    return (
                      <div
                        key={element.id}
                        className={`absolute cursor-pointer ${
                          selectedElement?.id === element.id
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        style={{
                          left: element.position_x,
                          top: element.position_y,
                          width: element.width || 40,
                          height: element.height || 40,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element);
                          setSelectedUnit(null);
                        }}
                        draggable={editMode === "move"}
                        onDragEnd={(e) => {
                          if (editMode === "move") {
                            const rect =
                              e.currentTarget.parentElement?.getBoundingClientRect();
                            if (rect) {
                              const x = (e.clientX - rect.left) / scale - 20;
                              const y = (e.clientY - rect.top) / scale - 20;
                              handleElementDrag(
                                element.id,
                                x,
                                y,
                                isNew,
                                newIndex
                              );
                            }
                          }
                        }}
                      >
                        <FloorElementIcon
                          type={element.element_type}
                          direction={element.direction}
                          size={element.width || 40}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Scale indicator */}
                {scale < 1 && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                    {Math.round(scale * 100)}%
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                Давхар сонгоно уу
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedUnit
                ? "Өрөөний мэдээлэл"
                : selectedElement
                ? "Элементийн мэдээлэл"
                : "Мэдээлэл"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedUnit ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="unit_number">Өрөөний дугаар</Label>
                  <Input
                    id="unit_number"
                    value={selectedUnit.unit_number}
                    onChange={(e) =>
                      handleLocalUnitUpdate(selectedUnit.id, {
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
                      handleLocalUnitUpdate(selectedUnit.id, {
                        area_sqm: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="width">Өргөн (px)</Label>
                    <Input
                      id="width"
                      type="number"
                      value={
                        localUnits[selectedUnit.id]?.width ??
                        selectedUnit.width ??
                        120
                      }
                      onChange={(e) =>
                        handleLocalUnitUpdate(selectedUnit.id, {
                          width: parseInt(e.target.value) || MIN_UNIT_WIDTH,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Өндөр (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={
                        localUnits[selectedUnit.id]?.height ??
                        selectedUnit.height ??
                        100
                      }
                      onChange={(e) =>
                        handleLocalUnitUpdate(selectedUnit.id, {
                          height: parseInt(e.target.value) || MIN_UNIT_HEIGHT,
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
                      handleLocalUnitUpdate(selectedUnit.id, {
                        status: e.target.value as Unit["status"],
                      })
                    }
                  >
                    <option value="vacant">Сул өрөө</option>
                    <option value="occupied">Эзэмшигчтэй</option>
                    <option value="maintenance">Засвартай</option>
                    <option value="reserved">Захиалсан</option>
                  </select>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleDeleteUnit(selectedUnit.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Өрөө устгах
                </Button>
              </div>
            ) : selectedElement ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FloorElementIcon
                    type={selectedElement.element_type}
                    direction={selectedElement.direction}
                    size={48}
                  />
                  <div>
                    <div className="font-medium">
                      {selectedElement.element_type === "door"
                        ? "Хаалга"
                        : selectedElement.element_type === "window"
                        ? "Цонх"
                        : selectedElement.element_type === "stairs"
                        ? "Шат"
                        : "Цахилгаан шат"}
                    </div>
                    <div className="text-sm text-gray-500">
                      Чиглэл:{" "}
                      {selectedElement.direction === "north"
                        ? "Хойд"
                        : selectedElement.direction === "south"
                        ? "Өмнөд"
                        : selectedElement.direction === "east"
                        ? "Зүүн"
                        : "Баруун"}
                    </div>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    const isNew = selectedElement.id.startsWith("temp-");
                    const newIndex = isNew
                      ? parseInt(selectedElement.id.replace("temp-", ""))
                      : undefined;
                    handleDeleteElement(selectedElement.id, isNew, newIndex);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Элемент устгах
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                Өрөө эсвэл элемент сонгоно уу
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
