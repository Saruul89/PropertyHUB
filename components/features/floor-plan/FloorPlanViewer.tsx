"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloorSelector } from "./FloorSelector";
import { FloorPlanLegend } from "./FloorPlanLegend";
import { UnitBlock } from "./UnitBlock";
import { FloorElementIcon } from "./FloorElementIcon";
import { createClient } from "@/lib/supabase/client";
import { Floor, Unit, Tenant, Lease } from "@/types";
import { Pencil, Info } from "lucide-react";

interface FloorWithUnits extends Floor {
  units: (Unit & { tenant?: Tenant | null; lease?: Lease | null })[];
}

interface FloorPlanViewerProps {
  propertyId: string;
  propertyName: string;
  showEditButton?: boolean;
}

export function FloorPlanViewer({
  propertyId,
  propertyName,
  showEditButton = true,
}: FloorPlanViewerProps) {
  const router = useRouter();
  const [floors, setFloors] = useState<FloorWithUnits[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch floors
    const { data: floorsData } = await supabase
      .from("floors")
      .select("*")
      .eq("property_id", propertyId)
      .order("floor_number", { ascending: true });

    // Fetch units with tenant info
    const { data: unitsData } = await supabase
      .from("units")
      .select("*")
      .eq("property_id", propertyId);

    // Fetch active leases with tenant info
    const { data: leasesData } = await supabase
      .from("leases")
      .select("*, tenant:tenants(*)")
      .eq("status", "active");

    // Map leases to units
    const unitLeaseMap = new Map<string, { tenant: Tenant; lease: Lease }>();
    leasesData?.forEach((lease: Lease & { tenant: Tenant }) => {
      unitLeaseMap.set(lease.unit_id, { tenant: lease.tenant, lease });
    });

    // Build floors with units and tenant info
    const floorsWithUnits: FloorWithUnits[] = (floorsData || []).map(
      (floor: Floor) => ({
        ...floor,
        units: (unitsData || [])
          .filter((unit: Unit) => unit.floor_id === floor.id)
          .map((unit: Unit) => {
            const leaseInfo = unitLeaseMap.get(unit.id);
            return {
              ...unit,
              tenant: leaseInfo?.tenant || null,
              lease: leaseInfo?.lease || null,
            };
          }),
      })
    );

    setFloors(floorsWithUnits);
    if (floorsWithUnits.length > 0 && !selectedFloorId) {
      setSelectedFloorId(floorsWithUnits[0].id);
    }
    setLoading(false);
  };

  const currentFloor = floors.find((f) => f.id === selectedFloorId);

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Ачааллаж байна...</div>
      </div>
    );
  }

  if (floors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 mb-4">Давхрын зураг тохируулагдаагүй байна</p>
          {showEditButton && (
            <Link href={`/dashboard/properties/${propertyId}/floor-plan/edit`}>
              <Button>
                <Pencil className="mr-2 h-4 w-4" />
                Давхрын зураг үүсгэх
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with floor selector */}
      <div className="flex items-center justify-between">
        <FloorSelector
          floors={floors}
          selectedFloorId={selectedFloorId}
          onSelect={setSelectedFloorId}
        />
        {showEditButton && (
          <Link href={`/dashboard/properties/${propertyId}/floor-plan/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Засах горим
            </Button>
          </Link>
        )}
      </div>

      {/* Floor Plan Canvas */}
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
            className="relative overflow-auto rounded-lg border bg-gray-50"
            style={{
              width: "100%",
              height: "500px",
            }}
          >
            {currentFloor && (
              <div
                className="relative"
                style={{
                  width: currentFloor.plan_width || 800,
                  height: currentFloor.plan_height || 600,
                  minWidth: "100%",
                  minHeight: "100%",
                  backgroundImage: currentFloor.plan_image_url
                    ? `url(${currentFloor.plan_image_url})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {currentFloor.units.map((unit) => (
                  <UnitBlock
                    key={unit.id}
                    unit={unit}
                    tenant={unit.tenant}
                    lease={unit.lease}
                    isSelected={selectedUnit?.id === unit.id}
                    onClick={handleUnitClick}
                  />
                ))}

                {/* Floor Elements (doors, windows, stairs, elevators) */}
                {currentFloor.elements?.map((element) => (
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <FloorPlanLegend />

      {/* Selected Unit Info */}
      {selectedUnit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              {selectedUnit.unit_number} дэлгэрэнгүй
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Талбай</span>
                <p className="font-medium">
                  {selectedUnit.area_sqm ? `${selectedUnit.area_sqm}m²` : "-"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Сарын түрээс</span>
                <p className="font-medium">
                  {selectedUnit.monthly_rent
                    ? `${new Intl.NumberFormat("mn-MN").format(
                        selectedUnit.monthly_rent
                      )}₮`
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Статус</span>
                <p className="font-medium">
                  {selectedUnit.status === "vacant" && "Сул өрөө"}
                  {selectedUnit.status === "occupied" && "Эзэмшигчтэй"}
                  {selectedUnit.status === "maintenance" && "Засвартай"}
                  {selectedUnit.status === "reserved" && "Захиалсан"}
                </p>
              </div>
              <div>
                <Link
                  href={`/dashboard/properties/${propertyId}/units/${selectedUnit.id}`}
                >
                  <Button size="sm" variant="outline">
                    Дэлгэрэнгүй харах
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
