import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { FloorTemplate, TemplateUnit, FloorElementData } from "@/types";

interface TemplateSaveInput {
  property_id: string;
  units: TemplateUnit[];
  elements: FloorElementData[];
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
    const body: TemplateSaveInput = await req.json();
    const { property_id, units, elements } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: "Property ID шаардлагатай" },
        { status: 400 }
      );
    }

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: "Барилга олдсонгүй" }, { status: 404 });
    }

    // Create template object
    const template: FloorTemplate = {
      units: units.map((unit, index) => ({
        position_x: unit.position_x,
        position_y: unit.position_y,
        width: unit.width,
        height: unit.height,
        relative_index: unit.relative_index ?? index + 1,
        area_sqm: unit.area_sqm,
      })),
      elements: elements.map((el) => ({
        id: el.id,
        element_type: el.element_type,
        direction: el.direction,
        position_x: el.position_x,
        position_y: el.position_y,
        width: el.width,
        height: el.height,
      })),
    };

    // Update template on all floors of this property
    const { error: updateError } = await supabase
      .from("floors")
      .update({ template })
      .eq("property_id", property_id);

    if (updateError) {
      console.error("Template save error:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "Загвар амжилттай хадгалагдлаа",
      template,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Загвар хадгалахад алдаа гарлаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
