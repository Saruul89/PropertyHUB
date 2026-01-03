# 02 - 認証システム

## Claude Code Implementation Guide - Authentication

---

## 1. 概要

### 1.1 ユーザータイプと認証方式

| ユーザータイプ  | 登録方法        | ログイン ID | パスワード       |
| --------------- | --------------- | ----------- | ---------------- |
| システム管理者  | 手動（DB 直接） | メール      | 自分で設定       |
| 管理会社        | 自己登録        | メール      | 自分で設定       |
| 入居者/テナント | 管理会社が作成  | 電話番号    | システム自動生成 |

### 1.2 技術仕様

- **認証基盤**: Supabase Auth
- **管理会社**: メール + パスワード（標準）
- **入居者**: 電話番号 → 偽装メール変換（`99001234@tenant.propertyhub.mn`）
- **メール確認**: 開発中は OFF（本番で有効化）

---

## 2. Supabase クライアント設定

### 2.1 ブラウザクライアント

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 2.2 サーバークライアント

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
```

### 2.3 管理者クライアント（Service Role）

```typescript
// lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
```

---

## 3. ユーティリティ関数

### 3.1 パスワード自動生成

```typescript
// lib/utils/password-generator.ts

/**
 * 入居者用の初期パスワードを生成
 * 8桁の数字ランダム
 */
export function generateInitialPassword(): string {
  const numbers = "0123456789";
  let password = "";

  for (let i = 0; i < 8; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return password;
}
```

### 3.2 電話番号 → 偽装メール変換

```typescript
// lib/utils/phone-to-email.ts

const TENANT_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_TENANT_EMAIL_DOMAIN || "tenant.propertyhub.mn";

export function phoneToEmail(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  return `${cleanPhone}@${TENANT_EMAIL_DOMAIN}`;
}

export function emailToPhone(email: string): string {
  return email.split("@")[0];
}

export function isTenantEmail(email: string): boolean {
  return email.endsWith(`@${TENANT_EMAIL_DOMAIN}`);
}
```

---

## 4. ログイン画面

```typescript
// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { phoneToEmail } from "@/lib/utils/phone-to-email";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantPassword, setTenantPassword] = useState("");

  const handleCompanyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: companyEmail,
      password: companyPassword,
    });

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    const { data: adminCheck } = await supabase
      .from("system_admins")
      .select("id")
      .eq("user_id", data.user.id)
      .single();

    router.push(adminCheck ? "/admin/dashboard" : "/dashboard");
  };

  const handleTenantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const email = phoneToEmail(tenantPhone);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: tenantPassword,
    });

    if (error) {
      setError("電話番号またはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    router.push("/tenant/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">PropertyHub</h1>

        <Tabs defaultValue="company">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="company">管理会社</TabsTrigger>
            <TabsTrigger value="tenant">入居者</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleCompanyLogin} className="space-y-4">
              <Input
                type="email"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="メールアドレス"
                required
              />
              <Input
                type="password"
                value={companyPassword}
                onChange={(e) => setCompanyPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <Link href="/register" className="text-blue-600 hover:underline">
                新規登録
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="tenant">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleTenantLogin} className="space-y-4">
              <Input
                type="tel"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="電話番号"
                required
              />
              <Input
                type="password"
                value={tenantPassword}
                onChange={(e) => setTenantPassword(e.target.value)}
                placeholder="パスワード"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              ※ アカウントは管理会社から発行されます
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
```

---

## 5. 管理会社登録

```typescript
// app/(auth)/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z
  .object({
    companyName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(8),
    confirmPassword: z.string(),
    companyType: z.enum(["apartment", "office"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { companyType: "apartment" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            company_name: data.companyName,
            phone: data.phone,
            role: "property_manager",
          },
        },
      });

      if (authError) throw authError;

      const res = await fetch("/api/auth/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user?.id,
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
          companyType: data.companyType,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).message);

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">新規登録</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <RadioGroup
            defaultValue="apartment"
            onValueChange={(v) => setValue("companyType", v as any)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="apartment" id="apartment" />
              <label htmlFor="apartment">アパート管理</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="office" id="office" />
              <label htmlFor="office">Оффис管理</label>
            </div>
          </RadioGroup>

          <Input {...register("companyName")} placeholder="会社名" />
          {errors.companyName && (
            <p className="text-red-500 text-sm">{errors.companyName.message}</p>
          )}

          <Input
            {...register("email")}
            type="email"
            placeholder="メールアドレス"
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}

          <Input {...register("phone")} placeholder="電話番号" />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone.message}</p>
          )}

          <Input
            {...register("password")}
            type="password"
            placeholder="パスワード（8文字以上）"
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}

          <Input
            {...register("confirmPassword")}
            type="password"
            placeholder="パスワード（確認）"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">
              {errors.confirmPassword.message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登録中..." : "登録する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

## 6. 会社登録 API

```typescript
// app/api/auth/register-company/route.ts
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, companyName, email, phone, companyType } = await req.json();

    const supabase = createAdminClient();

    // 会社作成（トリガーでfeaturesが自動設定される）
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName,
        email,
        phone,
        company_type: companyType || "apartment",
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // company_users作成
    await supabase.from("company_users").insert({
      company_id: company.id,
      user_id: userId,
      role: "admin",
    });

    // 無料サブスクリプション作成
    await supabase.from("subscriptions").insert({
      company_id: company.id,
      plan: "free",
      price_per_month: 0,
      status: "active",
      max_properties: 1,
      max_units: 50,
    });

    return NextResponse.json({ success: true, companyId: company.id });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
```

---

## 7. 入居者作成 API

```typescript
// app/api/tenants/route.ts
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { generateInitialPassword } from "@/lib/utils/password-generator";
import { phoneToEmail } from "@/lib/utils/phone-to-email";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: companyUser } = await supabase
    .from("company_users")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!companyUser)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { name, phone, unitId, tenantType, companyName, notes } =
      await req.json();

    const initialPassword = generateInitialPassword();
    const authEmail = phoneToEmail(phone);

    // Supabase Auth にユーザー作成
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email: authEmail,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { name, phone, role: "tenant" },
      });

    if (authError) throw authError;

    // tenants テーブルに追加
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        user_id: authData.user.id,
        company_id: companyUser.company_id,
        name,
        phone,
        tenant_type: tenantType || "individual",
        company_name: companyName,
        auth_email: authEmail,
        initial_password: initialPassword,
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    // 部屋が指定されている場合は契約も作成
    if (unitId) {
      const { data: unit } = await supabase
        .from("units")
        .select("monthly_rent")
        .eq("id", unitId)
        .single();

      await supabase.from("leases").insert({
        unit_id: unitId,
        tenant_id: tenant.id,
        company_id: companyUser.company_id,
        start_date: new Date().toISOString().split("T")[0],
        monthly_rent: unit?.monthly_rent || 0,
        status: "active",
      });

      await supabase
        .from("units")
        .update({ status: "occupied" })
        .eq("id", unitId);
    }

    return NextResponse.json({ success: true, tenant, initialPassword });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
```

---

## 8. ミドルウェア

```typescript
// middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const path = request.nextUrl.pathname;

  const protectedPaths = ["/dashboard", "/tenant", "/admin"];
  const authPaths = ["/login", "/register"];

  const isProtected = protectedPaths.some((p) => path.startsWith(p));
  const isAuthPath = authPaths.some((p) => path.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPath && session) {
    const email = session.user.email || "";
    const isTenant = email.includes("@tenant.");

    if (isTenant) {
      return NextResponse.redirect(new URL("/tenant/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
```

---

## 9. 認証フック

```typescript
// hooks/use-auth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { isTenantEmail } from "@/lib/utils/phone-to-email";

type UserRole = "system_admin" | "company_admin" | "company_staff" | "tenant";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole | null;
  companyId: string | null;
  tenantId: string | null;
}

export function useAuth() {
  const router = useRouter();
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    role: null,
    companyId: null,
    tenantId: null,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) updateUserInfo(session);
      else setState((prev) => ({ ...prev, loading: false }));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) await updateUserInfo(session);
      else
        setState({
          user: null,
          session: null,
          loading: false,
          role: null,
          companyId: null,
          tenantId: null,
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateUserInfo = async (session: Session) => {
    const email = session.user.email || "";

    if (isTenantEmail(email)) {
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, company_id")
        .eq("user_id", session.user.id)
        .single();

      setState({
        user: session.user,
        session,
        loading: false,
        role: "tenant",
        companyId: tenant?.company_id || null,
        tenantId: tenant?.id || null,
      });
      return;
    }

    const { data: adminCheck } = await supabase
      .from("system_admins")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (adminCheck) {
      setState({
        user: session.user,
        session,
        loading: false,
        role: "system_admin",
        companyId: null,
        tenantId: null,
      });
      return;
    }

    const { data: companyUser } = await supabase
      .from("company_users")
      .select("company_id, role")
      .eq("user_id", session.user.id)
      .single();

    setState({
      user: session.user,
      session,
      loading: false,
      role: companyUser?.role === "admin" ? "company_admin" : "company_staff",
      companyId: companyUser?.company_id || null,
      tenantId: null,
    });
  };

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/login");
  }, [router]);

  return { ...state, signOut };
}
```

---

**Document Version**: 2.0  
**Previous**: `01-DATABASE.md`  
**Next**: `03-CORE-PROPERTY.md`
