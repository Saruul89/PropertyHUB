# 09 - パフォーマンス・最適化・テスト戦略

## Claude Code Implementation Guide - Performance & Testing

> **Note**: このドキュメントは全仕様書（00-08）の実装時に適用すべき
> パフォーマンス最適化とテスト戦略をまとめたものです。

---

## ⚠️ Claude Code への最重要指示

### このドキュメントの優先度

```
実装時の確認順序:
1. 各機能の仕様書（03-08）を読む
2. このドキュメント（09）のパフォーマンス指針を確認
3. 実装
4. このドキュメントのテスト指針に従ってテスト
```

### 絶対に守るべきルール

1. **N+1 問題を絶対に作らない**
2. **無限スクロール or ページネーション必須**（50 件以上のリスト）
3. **重い処理はバックグラウンドへ**
4. **全機能にユニットテスト**
5. **主要フローに E2E テスト**

---

## 1. データベースパフォーマンス

### 1.1 インデックス戦略

**必須インデックス（`01-DATABASE.md` に追加）**:

```sql
-- 高頻度クエリ用インデックス

-- 会社でフィルター（ほぼ全テーブル）
CREATE INDEX idx_properties_company ON properties(company_id);
CREATE INDEX idx_units_company ON units(company_id);
CREATE INDEX idx_tenants_company ON tenants(company_id);
CREATE INDEX idx_billings_company ON billings(company_id);
CREATE INDEX idx_leases_company ON leases(company_id);

-- 物件でフィルター
CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_property_status ON units(property_id, status);

-- 請求検索
CREATE INDEX idx_billings_month ON billings(billing_month);
CREATE INDEX idx_billings_status ON billings(status);
CREATE INDEX idx_billings_tenant ON billings(tenant_id);
CREATE INDEX idx_billings_company_month ON billings(company_id, billing_month);

-- 契約検索
CREATE INDEX idx_leases_unit ON leases(unit_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_leases_end_date ON leases(end_date) WHERE end_date IS NOT NULL;

-- メーター検索
CREATE INDEX idx_meter_readings_unit_fee ON meter_readings(unit_id, fee_type_id);
CREATE INDEX idx_meter_readings_date ON meter_readings(reading_date DESC);

-- 通知キュー
CREATE INDEX idx_notifications_queue_status ON notifications_queue(status, scheduled_at);

-- 監査ログ
CREATE INDEX idx_audit_logs_created ON admin_audit_logs(created_at DESC);
```

### 1.2 クエリ最適化

**❌ 悪い例（N+1 問題）**:

```typescript
// 物件一覧を取得
const properties = await supabase.from("properties").select("*");

// 各物件のӨрөөний тооを個別に取得（N+1問題！）
for (const property of properties) {
  const { count } = await supabase
    .from("units")
    .select("*", { count: "exact" })
    .eq("property_id", property.id);
  property.unitCount = count;
}
```

**✅ 良い例（JOIN で 1 クエリ）**:

```typescript
// 1クエリで全データ取得
const { data: properties } = await supabase.from("properties").select(`
        *,
        units(count)
    `);

// または集計済みビューを使用
const { data: properties } = await supabase
  .from("properties_with_stats")
  .select("*");
```

### 1.3 集計用ビュー

**作成すべきビュー**:

```sql
-- 物件統計ビュー
CREATE VIEW properties_with_stats AS
SELECT
    p.*,
    COUNT(u.id) as total_units,
    COUNT(u.id) FILTER (WHERE u.status = 'occupied') as occupied_units,
    COUNT(u.id) FILTER (WHERE u.status = 'vacant') as vacant_units
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
GROUP BY p.id;

-- 請求サマリービュー
CREATE VIEW billing_summary AS
SELECT
    company_id,
    billing_month,
    COUNT(*) as total_count,
    SUM(total_amount) as total_amount,
    SUM(paid_amount) as paid_amount,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count
FROM billings
GROUP BY company_id, billing_month;

-- 入居者詳細ビュー（契約情報込み）
CREATE VIEW tenants_with_lease AS
SELECT
    t.*,
    l.id as lease_id,
    l.unit_id,
    u.unit_number,
    u.property_id,
    p.name as property_name
FROM tenants t
LEFT JOIN leases l ON l.tenant_id = t.id AND l.status = 'active'
LEFT JOIN units u ON u.id = l.unit_id
LEFT JOIN properties p ON p.id = u.property_id;
```

### 1.4 ページネーション

**必須**: 50 件以上になりうるリストは必ずページネーション

```typescript
// カーソルベースページネーション（推奨）
interface PaginationParams {
  cursor?: string; // 最後のアイテムのID
  limit: number; // デフォルト: 20, 最大: 100
  direction: "next" | "prev";
}

// 実装例
async function getProperties(params: PaginationParams) {
  let query = supabase
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(params.limit + 1); // +1 で次ページ有無を判定

  if (params.cursor) {
    query = query.lt("created_at", params.cursor);
  }

  const { data } = await query;

  const hasMore = data.length > params.limit;
  const items = hasMore ? data.slice(0, -1) : data;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? items[items.length - 1].created_at : null,
  };
}
```

---

## 2. フロントエンドパフォーマンス

### 2.1 データフェッチ戦略

| パターン  | 使用場面               | 実装                            |
| --------- | ---------------------- | ------------------------------- |
| SSR       | 初期表示が重要なページ | `page.tsx` でサーバーフェッチ   |
| CSR + SWR | 頻繁に更新されるデータ | `useSWR` でクライアントフェッチ |
| Static    | 変更が少ないデータ     | `generateStaticParams`          |
| Streaming | 大きなリスト           | Suspense + streaming            |

### 2.2 SWR 設定

```typescript
// lib/swr-config.ts
export const swrConfig = {
  revalidateOnFocus: false, // フォーカス時の再検証OFF
  revalidateOnReconnect: true, // 再接続時は再検証
  dedupingInterval: 5000, // 5秒間は重複リクエスト防止
  errorRetryCount: 3, // エラー時3回リトライ
};

// 使用例
function useProperties() {
  return useSWR("/api/properties", fetcher, {
    ...swrConfig,
    refreshInterval: 30000, // 30秒ごとに更新
  });
}
```

### 2.3 コンポーネント最適化

**メモ化**:

```typescript
// 重いリストアイテムはメモ化
const PropertyCard = memo(function PropertyCard({ property }: Props) {
  return <Card>...</Card>;
});

// コールバックもメモ化
const handleClick = useCallback(
  (id: string) => {
    router.push(`/properties/${id}`);
  },
  [router]
);
```

**遅延読み込み**:

```typescript
// 重いコンポーネントは動的インポート
const FloorPlanEditor = dynamic(
  () => import("@/components/features/floor-plan/FloorPlanEditor"),
  {
    loading: () => <Skeleton className="h-96" />,
    ssr: false, // クライアントのみ
  }
);

// PDFビューアも遅延
const PdfViewer = dynamic(() => import("@/components/shared/PdfViewer"), {
  ssr: false,
});
```

### 2.4 画像最適化

```typescript
// next/image を必ず使用
import Image from 'next/image';

// 適切なサイズ指定
<Image
    src={property.image_url}
    alt={property.name}
    width={400}
    height={300}
    placeholder="blur"
    blurDataURL={property.blur_hash}  // 低解像度プレースホルダー
/>

// アバターなど小さい画像
<Image
    src={tenant.avatar_url}
    alt=""
    width={40}
    height={40}
    className="rounded-full"
/>
```

### 2.5 バンドルサイズ最適化

```typescript
// ❌ 悪い例（全体インポート）
import { format, parse, addDays, subDays, ... } from 'date-fns';
import _ from 'lodash';

// ✅ 良い例（必要な関数のみ）
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import debounce from 'lodash/debounce';
```

---

## 3. API パフォーマンス

### 3.1 レスポンス時間目標

| エンドポイント種別 | 目標  | 最大許容 |
| ------------------ | ----- | -------- |
| 一覧取得（20 件）  | 100ms | 300ms    |
| 詳細取得           | 50ms  | 150ms    |
| 作成・更新         | 100ms | 500ms    |
| 請求生成（一括）   | 1s    | 5s       |
| PDF 生成           | 2s    | 10s      |
| レポート生成       | 3s    | 30s      |

### 3.2 重い処理のバックグラウンド化

```typescript
// ❌ 悪い例（同期処理）
export async function POST(req: NextRequest) {
  const billings = await generateBillings(params); // 重い
  await sendNotifications(billings); // 重い
  await generatePdfs(billings); // 重い

  return NextResponse.json({ success: true });
}

// ✅ 良い例（キューに入れて即レスポンス）
export async function POST(req: NextRequest) {
  // キューに追加のみ
  await supabase.from("job_queue").insert({
    type: "generate_billings",
    params: params,
    status: "pending",
  });

  // 即レスポンス
  return NextResponse.json({
    success: true,
    message: "請求生成をキューに追加しました",
  });
}

// バックグラウンドワーカー（別プロセス）で処理
```

### 3.3 キャッシュ戦略

```typescript
// Supabase クエリキャッシュ（unstable_cache）
import { unstable_cache } from "next/cache";

const getCompanyStats = unstable_cache(
  async (companyId: string) => {
    const { data } = await supabase
      .from("properties_with_stats")
      .select("*")
      .eq("company_id", companyId);
    return data;
  },
  ["company-stats"],
  { revalidate: 60 } // 60秒キャッシュ
);

// API Route でのキャッシュヘッダー
export async function GET(req: NextRequest) {
  const data = await getData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
    },
  });
}
```

---

## 4. リアルタイム更新

### 4.1 Supabase Realtime 使用箇所

| 機能               | リアルタイム | 理由             |
| ------------------ | :----------: | ---------------- |
| 請求一覧           |      ❌      | 更新頻度低       |
| 入居者一覧         |      ❌      | 更新頻度低       |
| メーター入力画面   |      ✅      | 複数人同時 засах |
| 通知キュー状況     |      ✅      | リアルタイム確認 |
| ダッシュボード統計 |      ❌      | ポーリングで十分 |

### 4.2 Realtime 実装例

```typescript
// メーター入力のリアルタイム同期
function useMeterReadings(propertyId: string, month: string) {
  const [readings, setReadings] = useState<MeterReading[]>([]);

  useEffect(() => {
    // 初期データ取得
    fetchReadings();

    // リアルタイム購読
    const subscription = supabase
      .channel(`meter-${propertyId}-${month}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meter_readings",
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          handleChange(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [propertyId, month]);

  return readings;
}
```

---

## 5. テスト戦略

### 5.1 テストピラミッド

```
        /\
       /  \        E2E テスト（10%）
      /    \       - 主要ユーザーフロー
     /──────\      - クリティカルパス
    /        \
   / 統合テスト \   統合テスト（30%）
  /   (30%)    \   - API エンドポイント
 /──────────────\  - DB操作
/                \
/   ユニットテスト  \ ユニットテスト（60%）
/      (60%)       \ - ユーティリティ関数
/────────────────────\ - コンポーネント
                       - ビジネスロジック
```

### 5.2 テストツール

| 種類           | ツール                | 設定ファイル         |
| -------------- | --------------------- | -------------------- |
| ユニット       | Vitest                | vitest.config.ts     |
| コンポーネント | React Testing Library | -                    |
| E2E            | Playwright            | playwright.config.ts |
| API            | Vitest + supertest    | -                    |

### 5.3 ディレクトリ構造

```
__tests__/
├── unit/
│   ├── utils/
│   │   ├── phone-to-email.test.ts
│   │   ├── password-generator.test.ts
│   │   └── billing-calculator.test.ts
│   ├── hooks/
│   │   ├── use-auth.test.ts
│   │   └── use-feature.test.ts
│   └── components/
│       ├── PropertyCard.test.tsx
│       └── BillingList.test.tsx
├── integration/
│   ├── api/
│   │   ├── properties.test.ts
│   │   ├── tenants.test.ts
│   │   └── billings.test.ts
│   └── db/
│       └── billing-generation.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── property-management.spec.ts
    ├── billing-flow.spec.ts
    └── admin.spec.ts
```

---

## 6. ユニットテスト

### 6.1 ユーティリティ関数テスト

```typescript
// __tests__/unit/utils/phone-to-email.test.ts
import { describe, it, expect } from "vitest";
import {
  phoneToEmail,
  emailToPhone,
  isTenantEmail,
} from "@/lib/utils/phone-to-email";

describe("phoneToEmail", () => {
  it("電話番号をメールに変換する", () => {
    expect(phoneToEmail("99001234")).toBe("99001234@tenant.propertyhub.mn");
  });

  it("ハイフンを除去する", () => {
    expect(phoneToEmail("99-00-1234")).toBe("99001234@tenant.propertyhub.mn");
  });

  it("スペースを除去する", () => {
    expect(phoneToEmail("99 001 234")).toBe("99001234@tenant.propertyhub.mn");
  });
});

describe("emailToPhone", () => {
  it("メールから電話番号を抽出する", () => {
    expect(emailToPhone("99001234@tenant.propertyhub.mn")).toBe("99001234");
  });
});

describe("isTenantEmail", () => {
  it("テナントメールを判定する", () => {
    expect(isTenantEmail("99001234@tenant.propertyhub.mn")).toBe(true);
    expect(isTenantEmail("user@example.com")).toBe(false);
  });
});
```

### 6.2 請求計算テスト

```typescript
// __tests__/unit/utils/billing-calculator.test.ts
import { describe, it, expect } from "vitest";
import {
  calculateFeeAmount,
  calculateBillingTotal,
} from "@/lib/billing/calculator";

describe("calculateFeeAmount", () => {
  it("固定料金を計算する", () => {
    const fee = {
      calculation_type: "fixed",
      default_amount: 50000,
    };
    expect(calculateFeeAmount(fee, {})).toBe(50000);
  });

  it("Талбай単価を計算する", () => {
    const fee = {
      calculation_type: "per_sqm",
      default_unit_price: 1000,
    };
    const unit = { area_sqm: 50 };
    expect(calculateFeeAmount(fee, { unit })).toBe(50000);
  });

  it("メーター料金を計算する", () => {
    const fee = {
      calculation_type: "metered",
    };
    const meterReading = {
      consumption: 10,
      unit_price: 2500,
    };
    expect(calculateFeeAmount(fee, { meterReading })).toBe(25000);
  });

  it("Талбайがnullの場合は0を返す", () => {
    const fee = {
      calculation_type: "per_sqm",
      default_unit_price: 1000,
    };
    const unit = { area_sqm: null };
    expect(calculateFeeAmount(fee, { unit })).toBe(0);
  });
});

describe("calculateBillingTotal", () => {
  it("複数の料金を合計する", () => {
    const items = [{ amount: 50000 }, { amount: 12000 }, { amount: 10000 }];
    expect(calculateBillingTotal(items)).toBe(72000);
  });

  it("空配列は0を返す", () => {
    expect(calculateBillingTotal([])).toBe(0);
  });
});
```

### 6.3 コンポーネントテスト

```typescript
// __tests__/unit/components/PropertyCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PropertyCard } from "@/components/features/properties/PropertyCard";

describe("PropertyCard", () => {
  const mockProperty = {
    id: "1",
    name: "テスト物件",
    property_type: "apartment",
    address: "テスト住所",
    total_units: 10,
    occupied_units: 8,
  };

  it("物件名を表示する", () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText("テスト物件")).toBeInTheDocument();
  });

  it("アパートタイプのバッジを表示する", () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText("アパート")).toBeInTheDocument();
  });

  it("入居率を計算して表示する", () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText("80%")).toBeInTheDocument();
  });

  it("詳細リンクが正しい", () => {
    render(<PropertyCard property={mockProperty} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/properties/1");
  });
});
```

---

## 7. 統合テスト

### 7.1 API テスト

```typescript
// __tests__/integration/api/properties.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Properties API", () => {
  let supabase: any;
  let testCompanyId: string;
  let testPropertyId: string;

  beforeAll(async () => {
    // テスト用クライアント
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // テスト用会社作成
    const { data: company } = await supabase
      .from("companies")
      .insert({ name: "テスト会社", email: "test@test.com" })
      .select()
      .single();
    testCompanyId = company.id;
  });

  afterAll(async () => {
    // クリーンアップ
    await supabase.from("properties").delete().eq("company_id", testCompanyId);
    await supabase.from("companies").delete().eq("id", testCompanyId);
  });

  it("物件を作成できる", async () => {
    const { data, error } = await supabase
      .from("properties")
      .insert({
        company_id: testCompanyId,
        name: "テスト物件",
        property_type: "apartment",
        address: "テスト住所",
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe("テスト物件");
    testPropertyId = data.id;
  });

  it("物件一覧を取得できる", async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("company_id", testCompanyId);

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  it("物件を更新できる", async () => {
    const { data, error } = await supabase
      .from("properties")
      .update({ name: "更新後の物件名" })
      .eq("id", testPropertyId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe("更新後の物件名");
  });
});
```

### 7.2 請求生成テスト

```typescript
// __tests__/integration/db/billing-generation.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateBillings } from "@/lib/billing/generate";

describe("Billing Generation", () => {
  let testData: TestData;

  beforeAll(async () => {
    // テストデータセットアップ
    testData = await setupBillingTestData();
  });

  afterAll(async () => {
    await cleanupBillingTestData(testData);
  });

  it("全入居者の請求を生成する", async () => {
    const result = await generateBillings({
      companyId: testData.companyId,
      billingMonth: "2024-03",
      issueDate: "2024-03-01",
      dueDate: "2024-03-15",
    });

    expect(result.created).toBe(testData.tenantCount);
  });

  it("固定料金が正しく計算される", async () => {
    const billing = await getBilling(testData.tenantIds[0], "2024-03");
    const managementFee = billing.items.find((i) => i.fee_name === "管理費");

    expect(managementFee.amount).toBe(50000);
  });

  it("メーター料金が正しく計算される", async () => {
    const billing = await getBilling(testData.tenantIds[0], "2024-03");
    const waterFee = billing.items.find((i) => i.fee_name === "水道代");

    // consumption: 10, unit_price: 2500
    expect(waterFee.amount).toBe(25000);
  });

  it("重複生成を防止する", async () => {
    const result = await generateBillings({
      companyId: testData.companyId,
      billingMonth: "2024-03",
      issueDate: "2024-03-01",
      dueDate: "2024-03-15",
    });

    expect(result.skipped).toBe(testData.tenantCount);
    expect(result.created).toBe(0);
  });
});
```

---

## 8. E2E テスト

### 8.1 認証フロー

```typescript
// __tests__/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("認証フロー", () => {
  test("管理会社がログインできる", async ({ page }) => {
    await page.goto("/login");

    // 管理会社タブを選択
    await page.click("text=管理会社");

    // ログイン情報入力
    await page.fill('input[type="email"]', "test@company.mn");
    await page.fill('input[type="password"]', "password123");

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // ダッシュボードにリダイレクト
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("ダッシュボード");
  });

  test("入居者が電話番号でログインできる", async ({ page }) => {
    await page.goto("/login");

    // 入居者タブを選択
    await page.click("text=入居者");

    // ログイン情報入力
    await page.fill('input[type="tel"]', "99001234");
    await page.fill('input[type="password"]', "Test1234");

    // ログインボタンクリック
    await page.click('button[type="submit"]');

    // 入居者ダッシュボードにリダイレクト
    await expect(page).toHaveURL("/tenant/dashboard");
  });

  test("無効な認証情報でエラーが表示される", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator(".text-red-600")).toBeVisible();
  });
});
```

### 8.2 請求フロー

```typescript
// __tests__/e2e/billing-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("請求フロー", () => {
  test.beforeEach(async ({ page }) => {
    // ログイン
    await loginAsCompanyAdmin(page);
  });

  test("請求を生成できる", async ({ page }) => {
    await page.goto("/dashboard/billings/generate");

    // 対象月を選択
    await page.selectOption('select[name="billingMonth"]', "2024-03");

    // 発行日を入力
    await page.fill('input[name="issueDate"]', "2024-03-01");

    // 支払期限を入力
    await page.fill('input[name="dueDate"]', "2024-03-15");

    // プレビューへ
    await page.click("text=次へ");

    // プレビュー確認
    await expect(page.locator("text=生成対象")).toBeVisible();

    // 生成実行
    await page.click("text=請求を生成");

    // 完了確認
    await expect(page.locator("text=請求を生成しました")).toBeVisible();
  });

  test("請求詳細を表示できる", async ({ page }) => {
    await page.goto("/dashboard/billings");

    // 最初の請求をクリック
    await page.click("table tbody tr:first-child");

    // 詳細ページ確認
    await expect(page.locator("text=請求詳細")).toBeVisible();
    await expect(page.locator("text=明細")).toBeVisible();
  });

  test("支払いを登録できる", async ({ page }) => {
    await page.goto("/dashboard/billings");
    await page.click("table tbody tr:first-child");

    // 支払登録ボタンクリック
    await page.click("text=支払登録");

    // 金額入力
    await page.fill('input[name="amount"]', "72000");

    // 支払日入力
    await page.fill('input[name="paymentDate"]', "2024-03-10");

    // 登録
    await page.click('button:has-text("登録")');

    // ステータス確認
    await expect(page.locator("text=支払済")).toBeVisible();
  });
});
```

### 8.3 管理者フロー

```typescript
// __tests__/e2e/admin.spec.ts
import { test, expect } from "@playwright/test";

test.describe("システム管理者", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSystemAdmin(page);
  });

  test("会社一覧を表示できる", async ({ page }) => {
    await page.goto("/admin/companies");

    await expect(page.locator("h1")).toContainText("会社管理");
    await expect(page.locator("table tbody tr")).not.toHaveCount(0);
  });

  test("会社の機能フラグを変更できる", async ({ page }) => {
    await page.goto("/admin/companies");

    // 最初の会社をクリック
    await page.click("table tbody tr:first-child");

    // 機能フラグзасахへ
    await page.click("text=機能フラグ");

    // フラグを変更
    await page.click('input[name="floor_plan"]');

    // Хадгалах
    await page.click("text=Хадгалах");

    // 成功確認
    await expect(page.locator("text=Хадгалахしました")).toBeVisible();
  });

  test("監査ログを確認できる", async ({ page }) => {
    await page.goto("/admin/logs");

    await expect(page.locator("h1")).toContainText("監査ログ");
    await expect(page.locator("table tbody tr")).not.toHaveCount(0);
  });
});
```

---

## 9. テストデータ管理

### 9.1 シードデータ

```typescript
// scripts/seed-test-data.ts

export async function seedTestData() {
  const supabase = createAdminClient();

  // テスト会社
  const { data: company } = await supabase
    .from("companies")
    .insert({
      name: "テスト管理会社",
      email: "test@company.mn",
      phone: "99001234",
      company_type: "apartment",
    })
    .select()
    .single();

  // テスト物件
  const { data: property } = await supabase
    .from("properties")
    .insert({
      company_id: company.id,
      name: "テストマンション",
      property_type: "apartment",
      address: "テスト住所",
      total_floors: 5,
    })
    .select()
    .single();

  // テスト部屋（10室）
  const units = Array.from({ length: 10 }, (_, i) => ({
    property_id: property.id,
    company_id: company.id,
    unit_number: `${Math.floor(i / 4) + 1}0${(i % 4) + 1}`,
    floor: Math.floor(i / 4) + 1,
    area_sqm: 50,
    monthly_rent: 500000,
    status: i < 8 ? "occupied" : "vacant",
  }));

  await supabase.from("units").insert(units);

  // ... 入居者、契約、料金タイプなど

  return { companyId: company.id, propertyId: property.id };
}
```

### 9.2 テスト後のクリーンアップ

```typescript
// scripts/cleanup-test-data.ts

export async function cleanupTestData(companyId: string) {
  const supabase = createAdminClient();

  // 依存順序に注意して削除
  await supabase.from("payments").delete().eq("company_id", companyId);
  await supabase
    .from("billing_items")
    .delete()
    .match({ "billings.company_id": companyId });
  await supabase.from("billings").delete().eq("company_id", companyId);
  await supabase.from("meter_readings").delete().eq("company_id", companyId);
  await supabase.from("leases").delete().eq("company_id", companyId);
  await supabase.from("tenants").delete().eq("company_id", companyId);
  await supabase.from("units").delete().eq("company_id", companyId);
  await supabase.from("properties").delete().eq("company_id", companyId);
  await supabase.from("company_users").delete().eq("company_id", companyId);
  await supabase.from("companies").delete().eq("id", companyId);
}
```

---

## 10. CI/CD パイプライン

### 10.1 GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run test:unit

  integration-test:
    runs-on: ubuntu-latest
    needs: unit-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}

  e2e-test:
    runs-on: ubuntu-latest
    needs: integration-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
        env:
          BASE_URL: ${{ secrets.TEST_BASE_URL }}
```

### 10.2 package.json スクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --dir __tests__/unit",
    "test:integration": "vitest run --dir __tests__/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

---

## 11. パフォーマンスモニタリング

### 11.1 監視項目

| 項目             | ツール                | 閾値    |
| ---------------- | --------------------- | ------- |
| ページロード時間 | Vercel Analytics      | < 3 秒  |
| API レスポンス   | Vercel Functions Logs | < 500ms |
| DB クエリ時間    | Supabase Dashboard    | < 100ms |
| エラー率         | Sentry                | < 0.1%  |

### 11.2 本番監視ダッシュボード

```typescript
// 推奨ツール
- Vercel Analytics（デフォルト）
- Sentry（エラー追跡）
- Supabase Dashboard（DB監視）
```

---

**Document Version**: 1.0  
**Previous**: `08-ADMIN.md`  
**Next**: 実装開始 🚀
