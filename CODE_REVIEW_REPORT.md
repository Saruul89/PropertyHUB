# PropertyHub コードレビューレポート

**レビュー日**: 2026-01-04  
**プロジェクト**: PropertyHub (モンゴル物件管理システム)  
**ファイル数**: 260+ TypeScript/TSX ファイル

---

## 📊 総合評価

| 項目               |    評価    | コメント                  |
| ------------------ | :--------: | ------------------------- |
| コード品質         |  ⭐⭐⭐⭐  | 良い構造、TypeScript 活用 |
| パフォーマンス     |   ⭐⭐⭐   | 改善の余地あり            |
| セキュリティ       |  ⭐⭐⭐⭐  | 認証チェックは適切        |
| エラーハンドリング |   ⭐⭐⭐   | 一部改善必要              |
| モンゴル語対応     | ⭐⭐⭐⭐⭐ | 完全対応                  |

---

## 🔴 重大な問題（優先度: 高）

### 1. N+1 問題の可能性

**ファイル**: `app/(dashboard)/dashboard/billings/generate/page.tsx`

```typescript
// 現在のコード (lines 201-224)
for (const lease of selectedLeases) {
  // 各リースごとにループ内で処理
  const unitFees = unitFeesMap.get(lease.unit_id) || [];
  for (const unitFee of unitFees) {
    // ...
  }
}
```

**問題**: バッチフェッチは実装済みだが、大量のリースがある場合にメモリ使用量が増大

**修正案**:

```typescript
// ページネーションまたは制限を追加
const MAX_BATCH_SIZE = 50;
if (selectedLeaseIds.length > MAX_BATCH_SIZE) {
  // 警告を表示
}
```

---

### 2. useEffect の依存配列問題

**ファイル**: `app/(dashboard)/dashboard/page.tsx` (line 28-31)

```typescript
// 現在のコード
useEffect(() => {
  if (companyId) {
    fetchStats();
  }
}, [companyId]); // ⚠️ fetchStats が依存配列にない
```

**問題**: ESLint 警告、fetchStats が再作成されるたびにエフェクトが実行されない

**修正案**:

```typescript
useEffect(() => {
  if (!companyId) return;

  const fetchStats = async () => {
    const supabase = createClient();
    // ... fetch logic
  };

  fetchStats();
}, [companyId]);
```

---

### 3. 型安全性の問題

**ファイル**: `app/(dashboard)/dashboard/billings/generate/page.tsx` (lines 101-113)

```typescript
// 現在のコード - 型アサーションが多い
setLeases(
  leasesData.map((l: Record<string, unknown>) => ({
    ...l,
    tenant: l.tenants as Tenant | undefined,
    unit: l.units
      ? {
          ...(l.units as Unit),
          property: (l.units as Record<string, unknown>).properties as
            | Property
            | undefined,
        }
      : undefined,
  })) as LeaseWithDetails[]
);
```

**修正案**: Supabase の型を自動生成

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

---

## 🟡 中程度の問題（優先度: 中）

### 4. ローディング状態の不統一

**問題箇所**: 複数のページで異なるローディング実装

```typescript
// ページA
{
  loading ? "-" : stats.propertyCount;
}

// ページB
{
  loading && <div>Ачааллаж байна...</div>;
}

// ページC
if (loading) return <Spinner />;
```

**修正案**: 共通のローディングコンポーネントを作成

```typescript
// components/ui/loading.tsx
export function Loading({ text = "Ачааллаж байна..." }) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="ml-2">{text}</span>
    </div>
  );
}
```

---

### 5. エラーハンドリングの不足

**ファイル**: `app/(dashboard)/dashboard/page.tsx` (lines 34-62)

```typescript
// 現在のコード - エラーハンドリングなし
const fetchStats = async () => {
  const supabase = createClient();

  const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
    // ... queries
  ]);

  // エラーチェックなし！
  const units = unitsRes.data || [];
  // ...
};
```

**修正案**:

```typescript
const fetchStats = async () => {
  try {
    const supabase = createClient();

    const [propertiesRes, unitsRes, tenantsRes] = await Promise.all([
      // ... queries
    ]);

    // エラーチェック
    if (propertiesRes.error) throw propertiesRes.error;
    if (unitsRes.error) throw unitsRes.error;
    if (tenantsRes.error) throw tenantsRes.error;

    // ... set state
  } catch (error) {
    console.error("Stats fetch error:", error);
    toast.error("Мэдээлэл ачааллахад алдаа гарлаа");
  } finally {
    setLoading(false);
  }
};
```

---

### 6. メモ化の不足

**ファイル**: 複数のリストコンポーネント

```typescript
// 現在のコード - 毎回再レンダリング
{
  leases.map((lease) => (
    <div key={lease.id} onClick={() => handleSelectLease(lease.id)}>
      {/* ... */}
    </div>
  ));
}
```

**修正案**:

```typescript
// メモ化されたリストアイテム
const LeaseItem = memo(function LeaseItem({
  lease,
  selected,
  onSelect,
}: LeaseItemProps) {
  return <div onClick={() => onSelect(lease.id)}>{/* ... */}</div>;
});

// 使用時
{
  leases.map((lease) => (
    <LeaseItem
      key={lease.id}
      lease={lease}
      selected={selectedLeaseIds.includes(lease.id)}
      onSelect={handleSelectLease}
    />
  ));
}
```

---

## 🟢 軽微な問題（優先度: 低）

### 7. コンソールログの残存

**問題**: 本番コードに `console.log` / `console.error` が残っている

**ファイル例**:

- `hooks/use-auth.ts` (line 104)
- 複数の API ルート

**修正案**:

```typescript
// lib/logger.ts
export const logger = {
  error: (msg: string, error?: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error(msg, error);
    }
    // 本番では Sentry などに送信
  },
};
```

---

### 8. マジックナンバー

**ファイル**: 複数箇所

```typescript
// 現在のコード
setTimeout(() => reject(new Error("timeout")), 3000); // 3000とは？
const days = parseInt(searchParams.get("days") || "30"); // 30とは？
```

**修正案**:

```typescript
// lib/constants/index.ts
export const TIMEOUTS = {
  AUTH_CHECK: 3000,
  API_REQUEST: 10000,
} as const;

export const DEFAULTS = {
  LEASE_EXPIRY_WARNING_DAYS: 30,
  PAGINATION_LIMIT: 20,
} as const;
```

---

## 🚀 パフォーマンス改善提案

### 1. React Query の導入（推奨）

現在の実装は各ページで `useState` + `useEffect` でデータフェッチしている。

**改善案**:

```typescript
// hooks/use-properties.ts
import { useQuery } from "@tanstack/react-query";

export function useProperties() {
  const { companyId } = useAuth();

  return useQuery({
    queryKey: ["properties", companyId],
    queryFn: () => fetchProperties(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
}
```

**メリット**:

- 自動キャッシュ
- 重複リクエスト防止
- バックグラウンド更新
- ローディング/エラー状態の統一

---

### 2. 動的インポート

**現在の問題**: 全コンポーネントが初期ロードで読み込まれる

**改善案**:

```typescript
// 重いコンポーネントを遅延読み込み
const FloorPlanEditor = dynamic(
  () => import("@/components/features/floor-plan/FloorPlanEditor"),
  {
    loading: () => <Loading />,
    ssr: false,
  }
);

const BillingPdfViewer = dynamic(
  () => import("@/components/features/billing/PdfViewer"),
  { ssr: false }
);
```

---

### 3. 画像最適化

**現在の問題**: 通常の `<img>` タグ使用の可能性

**改善案**:

```typescript
import Image from "next/image";

// プロパティ画像など
<Image
  src={property.image_url || "/placeholder.jpg"}
  alt={property.name}
  width={400}
  height={300}
  placeholder="blur"
  blurDataURL="/placeholder-blur.jpg"
/>;
```

---

## 📁 ファイル構造の改善提案

### 現在の構造（良い）

```
app/
├── (auth)/
├── (dashboard)/
├── (tenant)/
├── admin/
└── api/
```

### 追加推奨

```
app/
├── ...
├── error.tsx          # グローバルエラーページ（追加）
├── loading.tsx        # グローバルローディング（追加）
└── not-found.tsx      # 404ページ（追加）

lib/
├── ...
├── logger.ts          # ロガー（追加）
└── query-client.ts    # React Query設定（追加）
```

---

## 🔧 即時修正が必要なファイル

| ファイル                                               | 問題                                   | 優先度 |
| ------------------------------------------------------ | -------------------------------------- | :----: |
| `app/(dashboard)/dashboard/page.tsx`                   | useEffect 依存配列、エラーハンドリング |   高   |
| `hooks/use-auth.ts`                                    | タイムアウト処理のエラーログ           |   中   |
| `app/(dashboard)/dashboard/billings/generate/page.tsx` | 型安全性、大量データ処理               |   中   |

---

## ✅ 良い点

1. **モンゴル語対応が完璧**: UI テキスト、エラーメッセージ全てモンゴル語
2. **認証チェック**: 全 API ルートで適切な認証チェック
3. **コンポーネント分離**: 機能別に整理されている
4. **Supabase SSR**: 正しく設定されている
5. **TypeScript 活用**: 型定義が充実

---

## 📋 次のステップ

1. **今すぐ修正**: useEffect 依存配列、エラーハンドリング追加
2. **後に**: React Query 導入検討、ローディング統一
3. **次に**: 動的インポート、パフォーマンス測定

---

**レビュー担当**: Claude  
**レビュー方法**: 静的コード分析
