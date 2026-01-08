import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { FloorTemplate } from "@/types";

interface TemplateApplyInput {
  property_id: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: TemplateApplyInput = await req.json();
    const { property_id } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: "Property ID шаардлагатай" },
        { status: 400 }
      );
    }

    // Get all floors with template
    const { data: floors, error: floorsError } = await supabase
      .from("floors")
      .select("id, floor_number, template")
      .eq("property_id", property_id)
      .order("floor_number", { ascending: true });

    if (floorsError || !floors || floors.length === 0) {
      return NextResponse.json(
        { error: "Давхар олдсонгүй" },
        { status: 404 }
      );
    }

    // Get the template from the first floor (all floors have the same template)
    const template = floors[0].template as FloorTemplate | null;

    if (!template || !template.units || template.units.length === 0) {
      return NextResponse.json(
        { error: "Загвар хадгалагдаагүй байна. Эхлээд загвар хадгална уу." },
        { status: 400 }
      );
    }

    // Get company_id from property
    const { data: property } = await supabase
      .from("properties")
      .select("company_id")
      .eq("id", property_id)
      .single();

    if (!property) {
      return NextResponse.json({ error: "Барилга олдсонгүй" }, { status: 404 });
    }

    let totalUnitsCreated = 0;
    let totalElementsApplied = 0;

    // Apply template to each floor
    for (const floor of floors) {
      // Delete existing units on this floor
      await supabase
        .from("units")
        .delete()
        .eq("floor_id", floor.id);

      // Create new units based on template
      const newUnits = template.units.map((templateUnit) => ({
        property_id,
        company_id: property.company_id,
        floor_id: floor.id,
        unit_number: `${floor.floor_number}${String(templateUnit.relative_index).padStart(2, "0")}`,
        floor: floor.floor_number,
        position_x: templateUnit.position_x,
        position_y: templateUnit.position_y,
        width: templateUnit.width,
        height: templateUnit.height,
        area_sqm: templateUnit.area_sqm,
        status: "vacant",
        monthly_rent: 0,
      }));

      const { error: insertError } = await supabase
        .from("units")
        .insert(newUnits);

      if (insertError) {
        console.error(`Floor ${floor.floor_number} unit insert error:`, insertError);
      } else {
        totalUnitsCreated += newUnits.length;
      }

      // Apply elements to this floor
      const elementsWithNewIds = template.elements.map((el, idx) => ({
        ...el,
        id: `${floor.id}-elem-${idx}`,
      }));

      const { error: elementsError } = await supabase
        .from("floors")
        .update({ elements: elementsWithNewIds })
        .eq("id", floor.id);

      if (elementsError) {
        console.error(`Floor ${floor.floor_number} elements update error:`, elementsError);
      } else {
        totalElementsApplied += elementsWithNewIds.length;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Загвар ${floors.length} давхарт амжилттай хэрэгжлээ`,
      stats: {
        floors_updated: floors.length,
        units_created: totalUnitsCreated,
        elements_applied: totalElementsApplied,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Загвар хэрэгжүүлэхэд алдаа гарлаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
