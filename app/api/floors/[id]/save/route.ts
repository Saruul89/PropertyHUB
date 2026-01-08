import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { FloorSaveInput } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: floorId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: FloorSaveInput = await req.json();
    const { units, elements } = body;

    // Verify floor exists
    const { data: floor, error: floorError } = await supabase
      .from("floors")
      .select("id, property_id")
      .eq("id", floorId)
      .single();

    if (floorError || !floor) {
      return NextResponse.json({ error: "Давхар олдсонгүй" }, { status: 404 });
    }

    // Update unit positions and details
    if (units && units.length > 0) {
      for (const unit of units) {
        const updateData: Record<string, unknown> = {
          position_x: unit.position_x,
          position_y: unit.position_y,
          width: unit.width,
          height: unit.height,
        };

        // 追加フィールドがあれば更新
        if (unit.unit_number !== undefined) {
          updateData.unit_number = unit.unit_number;
        }
        if (unit.area_sqm !== undefined) {
          updateData.area_sqm = unit.area_sqm;
        }
        if (unit.status !== undefined) {
          updateData.status = unit.status;
        }

        const { error: unitError } = await supabase
          .from("units")
          .update(updateData)
          .eq("id", unit.id)
          .eq("floor_id", floorId);

        if (unitError) {
          console.error("Unit update error:", unitError);
        }
      }
    }

    // Update floor elements (stored as JSONB in floors table)
    const { error: elementsError } = await supabase
      .from("floors")
      .update({ elements: elements || [] })
      .eq("id", floorId);

    if (elementsError) {
      console.error("Elements update error:", elementsError);
      throw elementsError;
    }

    // Fetch updated data
    const { data: updatedFloor } = await supabase
      .from("floors")
      .select("*")
      .eq("id", floorId)
      .single();

    const { data: updatedUnits } = await supabase
      .from("units")
      .select("*")
      .eq("floor_id", floorId);

    return NextResponse.json({
      success: true,
      floor: updatedFloor,
      units: updatedUnits,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Хадгалахад алдаа гарлаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
