import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: propertyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { startFloor, endFloor, unitsPerFloor, prefix } = await req.json();

    // Баталгаажуулалт
    if (startFloor < 1 || endFloor < startFloor || unitsPerFloor < 1) {
      return NextResponse.json({ error: "Оруулсан утга буруу байна" }, { status: 400 });
    }

    // Одоо байгаа өрөөний дугаар авах
    const { data: existingUnits } = await supabase
      .from("units")
      .select("unit_number")
      .eq("property_id", propertyId);

    const existingNumbers = new Set(
      existingUnits?.map((u) => u.unit_number) || []
    );

    // Өрөөний дугаар үүсгэх
    const unitsToCreate: Array<{
      property_id: string;
      unit_number: string;
      floor: number;
      status: "vacant";
      monthly_rent: number;
    }> = [];

    for (let floor = startFloor; floor <= endFloor; floor++) {
      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        const unitNumber = `${prefix || ""}${floor}${String(unit).padStart(
          2,
          "0"
        )}`;

        // Одоо байгаа өрөөний дугаартай давхардал шалгах
        if (existingNumbers.has(unitNumber)) {
          return NextResponse.json(
            { error: `өрөөний дугаар ${unitNumber} үүсгэгдсэн байна` },
            { status: 400 }
          );
        }

        unitsToCreate.push({
          property_id: propertyId,
          unit_number: unitNumber,
          floor,
          status: "vacant",
          monthly_rent: 0,
        });
      }
    }

    // Бөөнөөр оруулах
    const { data: units, error } = await supabase
      .from("units")
      .insert(unitsToCreate)
      .select();

    if (error) throw error;

    return NextResponse.json(
      { units, count: units?.length || 0 },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Өрөө бөөнөөр үүсгэхэд алдаа гарлаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
