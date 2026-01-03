import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { UnitStatus } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { status } = (await req.json()) as { status: UnitStatus };

    // Баталгаажуулалт
    const validStatuses: UnitStatus[] = [
      "vacant",
      "occupied",
      "maintenance",
      "reserved",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Төлөв буруу байна" },
        { status: 400 }
      );
    }

    // occupied руу өөрчлөхийг зөвхөн гэрээгээр зөвшөөрнө
    if (status === "occupied") {
      const { data: activeLease } = await supabase
        .from("leases")
        .select("id")
        .eq("unit_id", id)
        .eq("status", "active")
        .single();

      if (!activeLease) {
        return NextResponse.json(
          { error: "Эзэмшигчтэй болгохын тулд гэрээ үүсгэнэ үү" },
          { status: 400 }
        );
      }
    }

    const { data: unit, error } = await supabase
      .from("units")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ unit });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Төлөв шинэчлэхэд алдаа гарлаа";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
