# 05 - Оффис 専用機能

## Claude Code Implementation Guide - Office Features

> **Note**: この機能は `company.features` の該当フラグが ON の場合のみ有効
> 共通機能は `03-CORE-PROPERTY.md` を参照

---

## 1. 概要

### 1.1 対象機能フラグ

| フラグ               | 機能                   | 依存              |
| -------------------- | ---------------------- | ----------------- |
| `floor_plan`         | ビジュアルフロアプラン | -                 |
| `lease_management`   | 詳細契約管理           | -                 |
| `lease_documents`    | 契約書管理             | lease_management  |
| `maintenance_vendor` | 業者管理・コスト追跡   | maintenance_basic |

### 1.2 関連テーブル（`01-DATABASE.md` 参照）

- `floors` - Давхар 情報（フロアプラン用）
- `units` - position_x, position_y, width, height（フロアプラン配置）
- `leases` - terms（詳細契約条件）
- `documents` - 契約書ファイル
- `maintenance_requests` - vendor_name, vendor_phone, estimated_cost, actual_cost

### 1.3 ファイル構造

```
components/features/
├── floor-plan/
│   ├── FloorPlanEditor.tsx
│   ├── FloorPlanViewer.tsx
│   ├── UnitBlock.tsx
│   └── FloorSelector.tsx
├── lease-detail/
│   ├── LeaseList.tsx
│   ├── LeaseForm.tsx
│   ├── LeaseDetail.tsx
│   └── LeaseTermsEditor.tsx
├── documents/
│   ├── DocumentList.tsx
│   ├── DocumentUpload.tsx
│   └── DocumentViewer.tsx
└── maintenance/
    ├── MaintenanceList.tsx
    ├── MaintenanceForm.tsx
    ├── MaintenanceDetail.tsx
    └── VendorSection.tsx
```

---

## 2. ビジュアルフロアプラン

> **機能フラグ**: `floor_plan`

### 2.1 フロアプラン概要

Оффис ビルの各 Давхар を視覚的に表示し、部屋の配置・ステータスを一目で把握できる機能。

**用途**:

- Сул өрөө 状況の視覚化
- 部屋の位置関係の把握
- テナント候補への提案資料

### 2.2 フロアプラン閲覧画面

**パス**: `/dashboard/properties/[id]/floor-plan`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ フロアプラン                              [засахモード]      │
├─────────────────────────────────────────────────────────────┤
│ Давхар選択: [1F] [2F] [3F] [4F] [5F]                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                        3F                               │ │
│ │  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐  │ │
│ │  │  301     │ │  302     │ │        303             │  │ │
│ │  │  Сул өрөө    │ │  Эзэмшигчтэй  │ │      Эзэмшигчтэй            │  │ │
│ │  │  50m²   │ │  50m²   │ │       100m²            │  │ │
│ │  │ ₮800k   │ │ ABC社   │ │      XYZ社             │  │ │
│ │  └──────────┘ └──────────┘ └────────────────────────┘  │ │
│ │                                                         │ │
│ │  ┌──────────────────────┐ ┌──────────────────────────┐ │ │
│ │  │       304            │ │         305              │ │ │
│ │  │     Засвартай      │ │        Сул өрөө             │ │ │
│ │  │       80m²          │ │         70m²            │ │ │
│ │  └──────────────────────┘ └──────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Тайлбар: [青]Сул өрөө [緑]Эзэмшигчтэй [黄]メンテ [紫]予約              │
└─────────────────────────────────────────────────────────────┘
```

**部屋ブロック表示項目**:
| 項目 | Сул өрөө 時 | Эзэмшигчтэй 時 |
|------|--------|---------|
| 部屋番号 | ✅ | ✅ |
| ステータス | 「Сул өрөө」 | 会社名/入居者名 |
| Талбай | ✅ | ✅ |
| 月額賃料 | ✅ | - |

**インタラクション**:

- 部屋クリック → 部屋詳細モーダル or 詳細ページへ
- ホバー → 詳細情報ツールチップ

### 2.3 フロアプラン засах 画面

**パス**: `/dashboard/properties/[id]/floor-plan/edit`

**機能**:

- Давхар の背景画像アップロード（任意）
- 部屋ブロックのドラッグ配置
- 部屋ブロックのリサイズ
- グリッドスナップ（整列補助）

**部屋ブロック засах**:
| 項目 | 説明 |
|------|------|
| position_x | X 座標（px） |
| position_y | Y 座標（px） |
| width | 幅（px） |
| height | 高さ（px） |

**操作**:

- ドラッグ → position_x, position_y 更新
- 角をドラッグ → width, height 更新
- 右クリック → コンテキストメニュー（засах/削除）

### 2.4 Давхар 管理

**パス**: `/dashboard/properties/[id]/floors`

**フォーム項目**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| floor_number | number | ✅ | Давхар 数（-1, 0, 1, 2...） |
| name | string | - | 表示名（例: B1, 1F, 屋上） |
| plan_width | number | - | プラン幅（px）デフォルト: 800 |
| plan_height | number | - | プラン高さ（px）デフォルト: 600 |
| plan_image_url | string | - | 背景画像 URL |

---

## 3. 詳細契約管理

> **機能フラグ**: `lease_management`

### 3.1 契約一覧画面

**パス**: `/dashboard/leases`

**表示項目**:
| 項目 | 説明 |
|------|------|
| 契約番号 | 自動採番 or 手動 |
| テナント | 会社名/個人名 |
| 物件/部屋 | 物件名 + 部屋番号 |
| 契約期間 | 開始日 〜 終了日 |
| 月額賃料 | ₮ 表示 |
| ステータス | active/expired/terminated/pending |
| 残り日数 | 契約終了までの日数（期限あり時） |

**フィルター**:

- ステータス
- 物件
- 契約終了間近（30 日以内）

**ソート**:

- 契約開始日
- 契約終了日
- 月額賃料

### 3.2 契約登録・засах 画面

**パス**: `/dashboard/leases/new`, `/dashboard/leases/[id]/edit`

**基本情報**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| tenant_id | select | ✅ | テナント選択 |
| unit_id | select | ✅ | 部屋選択 |
| start_date | date | ✅ | 契約開始日 |
| end_date | date | - | 契約終了日（空=無期限） |
| monthly_rent | number | ✅ | 月額賃料 |
| deposit | number | - | 敷金/保証金 |
| payment_due_day | number | - | 支払期日（1-28）デフォルト: 1 |
| status | select | ✅ | ステータス |
| notes | textarea | - | 備考 |

**契約条件（terms）**:
| フィールド | 型 | 説明 |
|-----------|-----|------|
| rent_increase_rate | number | 年間賃料上昇率（%） |
| rent_increase_interval | number | 賃料見直し間隔（月） |
| notice_period_days | number | 解約予告期間（日） |
| renewal_terms | string | 更新条件 |
| special_conditions | string | 特約事項 |

### 3.3 契約詳細画面

**パス**: `/dashboard/leases/[id]`

**表示セクション**:

```
┌─────────────────────────────────────────────────────────────┐
│ 契約詳細                           [засах] [契約書] [終了]   │
├─────────────────────────────────────────────────────────────┤
│ ┌─ 基本情報 ──────────────────────────────────────────────┐ │
│ │ テナント: ABC株式会社                                   │ │
│ │ 物件/部屋: Оффисタワー / 301                         │ │
│ │ 契約期間: 2024-01-01 〜 2025-12-31 (残り320日)         │ │
│ │ 月額賃料: ₮2,000,000                                   │ │
│ │ 敷金: ₮4,000,000                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ 契約条件 ──────────────────────────────────────────────┐ │
│ │ 賃料上昇率: 3%/年                                       │ │
│ │ 解約予告: 90日前                                        │ │
│ │ 特約: ...                                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ 契約書類 ──────────────────────────────────────────────┐ │
│ │ • 賃貸借契約書.pdf (2024-01-01)                        │ │
│ │ • 覚書.pdf (2024-06-15)                                │ │
│ │ [+ 書類追加]                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ 請求履歴 ──────────────────────────────────────────────┐ │
│ │ 2024-01: ₮2,000,000 (支払済)                           │ │
│ │ 2024-02: ₮2,000,000 (支払済)                           │ │
│ │ 2024-03: ₮2,000,000 (未払い)                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 契約更新・終了

**更新処理**:

1. 現契約を `expired` に
2. 新契約を `active` で作成
3. 条件を引き継ぎ or 変更

**終了処理**:

1. 確認ダイアログ
2. `status` を `terminated` に
3. `end_date` を設定
4. `unit.status` を `vacant` に

### 3.5 契約期限アラート

**自動チェック**:

- 毎日、契約終了 30 日前のものを抽出
- ダッシュボードに警告表示
- （`email_notifications` ON 時）メール通知

---

## 4. 契約書管理

> **機能フラグ**: `lease_documents`（`lease_management` も必要）

### 4.1 書類一覧

**パス**: `/dashboard/leases/[id]/documents` または 契約詳細内

**表示項目**:
| 項目 | 説明 |
|------|------|
| ファイル名 | クリックでプレビュー/ダウンロード |
| ファイルタイプ | PDF, Word, Image 等 |
| アップロード日 | |
| アップロード者 | |
| 説明 | 任意のメモ |

### 4.2 書類アップロード

**対応ファイル**:

- PDF（推奨）
- Word (.doc, .docx)
- 画像 (.jpg, .png)
- 最大サイズ: 10MB

**フォーム項目**:
| フィールド | 型 | 必須 |
|-----------|-----|:----:|
| file | file | ✅ |
| description | string | - |

**Хадгалах 先**: Supabase Storage `documents/{company_id}/{lease_id}/`

### 4.3 書類の関連付け

書類は以下のいずれかに関連付け可能:

- `lease_id` - 契約
- `property_id` - 物件
- `unit_id` - 部屋
- `tenant_id` - テナント

---

## 5. Засвартай 管理（業者管理付き）

> **機能フラグ**: `maintenance_basic`（基本）+ `maintenance_vendor`（業者管理）

### 5.1 Засвартай 一覧画面

**パス**: `/dashboard/maintenance`

**表示項目**:
| 項目 | 説明 |
|------|------|
| タイトル | リクエスト概要 |
| 物件/部屋 | 対象場所 |
| 優先度 | low/normal/high/urgent |
| カテゴリ | 電気、水道、空調、その他 |
| ステータス | pending/in_progress/completed/cancelled |
| 依頼日 | |
| 予定日 | scheduled_date |

**フィルター**:

- ステータス
- 優先度
- 物件

### 5.2 Засвартай 登録画面

**パス**: `/dashboard/maintenance/new`

**基本項目**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| property_id | select | ✅ | 物件 |
| unit_id | select | - | 部屋（共用部の場合は空） |
| title | string | ✅ | タイトル |
| description | textarea | - | 詳細説明 |
| priority | select | ✅ | low/normal/high/urgent |
| category | select | - | 電気/水道/空調/清掃/その他 |
| scheduled_date | date | - | 予定日 |

**業者情報（`maintenance_vendor` ON 時）**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| vendor_name | string | - | 業者名 |
| vendor_phone | string | - | 業者連絡先 |
| estimated_cost | number | - | 見積金額 |

### 5.3 Засвартай 詳細画面

**パス**: `/dashboard/maintenance/[id]`

**表示セクション**:

```
┌─────────────────────────────────────────────────────────────┐
│ Засвартай詳細                    [засах] [ステータス変更] │
├─────────────────────────────────────────────────────────────┤
│ ┌─ 基本情報 ──────────────────────────────────────────────┐ │
│ │ タイトル: エアコン故障                                  │ │
│ │ 物件/部屋: Оффисタワー / 301                         │ │
│ │ 優先度: [!高]                                          │ │
│ │ ステータス: 対応中                                      │ │
│ │ 依頼者: ABC株式会社                                     │ │
│ │ 依頼日: 2024-03-01                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ 業者情報 ──────────────────────────────────────────────┐ │
│ │ 業者名: 〇〇空調サービス                                │ │
│ │ 連絡先: 99-1234-5678                                    │ │
│ │ 予定日: 2024-03-05                                      │ │
│ │ 見積: ₮500,000                                         │ │
│ │ 実費: (未入力)                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ 説明 ──────────────────────────────────────────────────┐ │
│ │ 3Давхар301号室のエアコンが動作しない。                      │ │
│ │ 電源は入るが冷風が出ない。                              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Засвартай ステータス遷移

```
┌──────────┐   作業開始   ┌─────────────┐   完了    ┌───────────┐
│ pending  │────────────▶│ in_progress │─────────▶│ completed │
│ (依頼中) │             │  (対応中)   │          │  (完了)   │
└────┬─────┘             └─────────────┘          └───────────┘
     │
     │ キャンセル
     ▼
┌───────────┐
│ cancelled │
│ (取消)    │
└───────────┘
```

### 5.5 完了処理

完了時に入力:
| フィールド | 型 | 必須 |
|-----------|-----|:----:|
| completed_date | date | ✅ |
| actual_cost | number | - |
| notes | textarea | - |

---

## 6. API エンドポイント

### 6.1 フロアプラン API

| メソッド | パス                          | 説明         |
| -------- | ----------------------------- | ------------ |
| GET      | `/api/properties/[id]/floors` | Давхар 一覧  |
| POST     | `/api/properties/[id]/floors` | Давхар 追加  |
| PUT      | `/api/floors/[id]`            | Давхар 更新  |
| PUT      | `/api/units/[id]/position`    | 部屋位置更新 |

### 6.2 契約 API

| メソッド | パス                         | 説明                       |
| -------- | ---------------------------- | -------------------------- |
| GET      | `/api/leases`                | 契約一覧（フィルター付き） |
| POST     | `/api/leases`                | 契約作成                   |
| GET      | `/api/leases/[id]`           | 契約詳細                   |
| PUT      | `/api/leases/[id]`           | 契約更新                   |
| POST     | `/api/leases/[id]/terminate` | 契約終了                   |
| POST     | `/api/leases/[id]/renew`     | 契約更新                   |
| GET      | `/api/leases/expiring`       | 期限間近の契約             |

### 6.3 書類 API

| メソッド | パス                           | 説明                  |
| -------- | ------------------------------ | --------------------- |
| GET      | `/api/leases/[id]/documents`   | 契約の書類一覧        |
| POST     | `/api/documents`               | 書類アップロード      |
| DELETE   | `/api/documents/[id]`          | 書類削除              |
| GET      | `/api/documents/[id]/download` | ダウンロード URL 取得 |

### 6.4 Засвартай API

| メソッド | パス                             | 説明                   |
| -------- | -------------------------------- | ---------------------- |
| GET      | `/api/maintenance`               | 一覧（フィルター付き） |
| POST     | `/api/maintenance`               | 新規作成               |
| GET      | `/api/maintenance/[id]`          | 詳細                   |
| PUT      | `/api/maintenance/[id]`          | 更新                   |
| PUT      | `/api/maintenance/[id]/status`   | ステータス変更         |
| POST     | `/api/maintenance/[id]/complete` | 完了処理               |

---

## 7. 入力型定義

```typescript
interface FloorInput {
  floor_number: number; // required
  name?: string;
  plan_width?: number; // default: 800
  plan_height?: number; // default: 600
  plan_image_url?: string;
}

interface UnitPositionInput {
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface LeaseInput {
  tenant_id: string; // required
  unit_id: string; // required
  start_date: string; // required, YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  monthly_rent: number; // required
  deposit?: number;
  payment_due_day?: number; // 1-28, default: 1
  status: "active" | "expired" | "terminated" | "pending";
  terms?: LeaseTerms;
  notes?: string;
}

interface LeaseTerms {
  rent_increase_rate?: number; // %
  rent_increase_interval?: number; // months
  notice_period_days?: number;
  renewal_terms?: string;
  special_conditions?: string;
}

interface DocumentInput {
  file: File; // required
  description?: string;
  lease_id?: string;
  property_id?: string;
  unit_id?: string;
  tenant_id?: string;
}

interface MaintenanceInput {
  property_id: string; // required
  unit_id?: string;
  title: string; // required
  description?: string;
  priority: "low" | "normal" | "high" | "urgent";
  category?: string;
  scheduled_date?: string;
  // maintenance_vendor ON時
  vendor_name?: string;
  vendor_phone?: string;
  estimated_cost?: number;
}

interface MaintenanceCompleteInput {
  completed_date: string; // required
  actual_cost?: number;
  notes?: string;
}
```

---

## 8. 画面アクセス制御

```typescript
// 機能フラグによる表示制御

// サイドバー - フロアプラン
{
  useFeature("floor_plan") && (
    <NavItem href={`/dashboard/properties/${id}/floor-plan`}>
      フロアプラン
    </NavItem>
  );
}

// サイドバー - 契約管理
{
  useFeature("lease_management") && (
    <NavItem href="/dashboard/leases">契約管理</NavItem>
  );
}

// サイドバー - Засвартай
{
  useFeature("maintenance_basic") && (
    <NavItem href="/dashboard/maintenance">Засвартай</NavItem>
  );
}

// 契約詳細内 - 書類セクション
{
  useFeature("lease_documents") && <DocumentSection leaseId={lease.id} />;
}

// Засвартайフォーム内 - 業者セクション
{
  useFeature("maintenance_vendor") && <VendorSection />;
}
```

---

**Document Version**: 1.0  
**Previous**: `04-APARTMENT-FEATURES.md`  
**Next**: `06-BILLING.md`
