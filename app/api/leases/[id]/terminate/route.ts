import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: leaseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Гэрээний мэдээлэл авах
    const { data: lease, error: leaseError } = await supabase
      .from("leases")
      .select("id, unit_id, status")
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) {
      return NextResponse.json(
        { error: "Гэрээ олдсонгүй" },
        { status: 404 }
      );
    }

    if (lease.status !== "active") {
      return NextResponse.json(
        { error: "Энэ гэрээ аль хэдийн дууссан байна" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Гэрээг дуусгах
    const { error: updateLeaseError } = await supabase
      .from("leases")
      .update({
        status: "terminated",
        end_date: today,
      })
      .eq("id", leaseId);

    if (updateLeaseError) throw updateLeaseError;

    // Өрөөг Сул өрөө болгох
    const { error: updateUnitError } = await supabase
      .from("units")
      .update({ status: "vacant" })
      .eq("id", lease.unit_id);

    if (updateUnitError) throw updateUnitError;

    return NextResponse.json({
      success: true,
      message: "Гарах үйл явц амжилттай боллоо",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Гарах үйл явц амжилтгүй боллоо";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
