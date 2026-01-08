import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { generateInitialPassword } from "@/lib/utils/password-generator";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get company info
  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .single();

  if (!companyUser) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Only admins can view staff list
  if (companyUser.role !== "admin") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  // Get all company users with their auth info
  const { data: users, error } = await supabase
    .from("company_users")
    .select("*")
    .eq("company_id", companyUser.company_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
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

  // Only admins can add staff
  if (companyUser.role !== "admin") {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const { name, email, phone } = await req.json();

    // Check if email already exists in company_users
    const { data: existingUser } = await supabase
      .from("company_users")
      .select("id")
      .eq("company_id", companyUser.company_id)
      .eq("user_email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "Энэ имэйл хаягтай ажилтан бүртгэлтэй байна" },
        { status: 400 }
      );
    }

    const initialPassword = generateInitialPassword();

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { name, phone, role: "company_staff" },
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { message: "Энэ имэйл хаяг өөр бүртгэлд ашиглагдаж байна" },
          { status: 400 }
        );
      }
      throw authError;
    }

    // Insert into company_users table
    const { data: newUser, error: insertError } = await supabase
      .from("company_users")
      .insert({
        company_id: companyUser.company_id,
        user_id: authData.user.id,
        role: "staff",
        is_active: true,
        user_email: email,
        user_name: name,
        user_phone: phone || null,
        initial_password: initialPassword,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: delete auth user if company_users insert fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      initialPassword,
    });
  } catch (error) {
    console.error("Create staff error:", error);
    const message =
      error instanceof Error ? error.message : "Ажилтан үүсгэхэд алдаа гарлаа";
    return NextResponse.json({ message }, { status: 500 });
  }
}
