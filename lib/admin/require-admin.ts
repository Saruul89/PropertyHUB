import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AdminRole, AuthenticatedAdmin } from "@/types/admin";

export class AdminAuthError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.name = "AdminAuthError";
    this.statusCode = statusCode;
  }
}

interface AdminCheckResult {
  admin: AuthenticatedAdmin;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

// 管理者認証ヘルパー
export async function requireSystemAdmin(
  request?: NextRequest
): Promise<AdminCheckResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AdminAuthError("Unauthorized: Not authenticated", 401);
  }

  // system_admins テーブルでチェック
  const { data: admin, error: adminError } = await supabase
    .from("system_admins")
    .select("id, user_id, role, is_active, name, email")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (adminError || !admin) {
    throw new AdminAuthError("Forbidden: Not a system admin", 403);
  }

  return {
    admin: {
      id: admin.id,
      user_id: admin.user_id,
      email: admin.email || user.email || "",
      name: admin.name,
      role: admin.role as AdminRole,
    },
    supabase,
  };
}

// 特定のロール以上を要求
export async function requireAdminRole(
  requiredRole: AdminRole,
  request?: NextRequest
): Promise<AdminCheckResult> {
  const result = await requireSystemAdmin(request);
  const { admin } = result;

  const roleHierarchy: Record<AdminRole, number> = {
    super: 3,
    admin: 2,
    support: 1,
  };

  if (roleHierarchy[admin.role] < roleHierarchy[requiredRole]) {
    throw new AdminAuthError(
      `Forbidden: Requires ${requiredRole} role or higher`,
      403
    );
  }

  return result;
}

// ロールチェック（boolean返却）
export function hasRequiredRole(
  userRole: AdminRole,
  requiredRole: AdminRole
): boolean {
  const roleHierarchy: Record<AdminRole, number> = {
    super: 3,
    admin: 2,
    support: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// засах可能かチェック（support は閲覧のみ）
export function canEdit(role: AdminRole): boolean {
  return role === "super" || role === "admin";
}

// 管理者管理可能かチェック（super のみ）
export function canManageAdmins(role: AdminRole): boolean {
  return role === "super";
}

// リクエストからIPアドレス取得
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}

// リクエストからUser-Agent取得
export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

// エラーレスポンス生成
export function createErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return Response.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  console.error("Admin API Error:", error);
  return Response.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}
