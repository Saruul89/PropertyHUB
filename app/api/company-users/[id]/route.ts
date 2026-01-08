import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get company info and verify admin role
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .single();

  if (!companyUser) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (companyUser.role !== "admin") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const { name, phone, is_active } = await req.json();

    // Verify the staff belongs to the same company
    const { data: staffToUpdate } = await supabase
      .from("company_users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyUser.company_id)
      .single();

    if (!staffToUpdate) {
      return NextResponse.json(
        { error: "Ажилтан олдсонгүй" },
        { status: 404 }
      );
    }

    // Cannot deactivate yourself
    if (staffToUpdate.user_id === user.id && is_active === false) {
      return NextResponse.json(
        { message: "Өөрийгөө идэвхгүй болгох боломжгүй" },
        { status: 400 }
      );
    }

    // Update company_users record
    const { data: updatedUser, error: updateError } = await supabase
      .from("company_users")
      .update({
        user_name: name,
        user_phone: phone || null,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update staff error:", error);
    const message =
      error instanceof Error ? error.message : "Ажилтан засахад алдаа гарлаа";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get company info and verify admin role
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .single();

  if (!companyUser) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  if (companyUser.role !== "admin") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    // Get the staff to delete
    const { data: staffToDelete } = await supabase
      .from("company_users")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyUser.company_id)
      .single();

    if (!staffToDelete) {
      return NextResponse.json(
        { error: "Ажилтан олдсонгүй" },
        { status: 404 }
      );
    }

    // Cannot delete yourself
    if (staffToDelete.user_id === user.id) {
      return NextResponse.json(
        { message: "Өөрийгөө устгах боломжгүй" },
        { status: 400 }
      );
    }

    // Cannot delete admins (only deactivate)
    if (staffToDelete.role === "admin") {
      return NextResponse.json(
        { message: "Админыг устгах боломжгүй. Зөвхөн идэвхгүй болгох боломжтой." },
        { status: 400 }
      );
    }

    // Delete from company_users first
    const { error: deleteError } = await supabase
      .from("company_users")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete from Supabase Auth
    const { error: authDeleteError } =
      await adminSupabase.auth.admin.deleteUser(staffToDelete.user_id);

    if (authDeleteError) {
      console.error("Failed to delete auth user:", authDeleteError);
      // Don't throw - the company_users record is already deleted
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete staff error:", error);
    const message =
      error instanceof Error ? error.message : "Ажилтан устгахад алдаа гарлаа";
    return NextResponse.json({ message }, { status: 500 });
  }
}
