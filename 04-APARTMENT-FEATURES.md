# 04 - アパート専用機能

## Claude Code Implementation Guide - Apartment Features

> **Note**: この機能は `company.features` の該当フラグが ON の場合のみ有効
> 共通機能は `03-CORE-PROPERTY.md` を参照

---

## ⚠️ Claude Code への最重要指示

このプロジェクトでは、この `03-CORE-PROPERTY.md` を起点に、多くの FEATURES ドキュメント（`04-APARTMENT-FEATURES.md`, `05-OFFICE-FEATURES.md`, `06-BILLING.md` など）が追加されていきます。

### 実装時の最優先事項

**機能（FEATURES）は、わかりやすく・修正しやすく作成すること**

具体的には：

1. **コンポーネントの分離**

   - 各機能は独立したコンポーネント/モジュールとして実装
   - 機能フラグで ON/OFF できる設計
   - 他の機能に影響を与えない

2. **ファイル構造の一貫性**

   ```
   components/features/
   ├── properties/     # 03-CORE（共通）
   ├── units/          # 03-CORE（共通）
   ├── tenants/        # 03-CORE（共通）
   ├── meter/          # 04-APARTMENT
   ├── floor-plan/     # 05-OFFICE
   ├── lease-detail/   # 05-OFFICE
   └── billing/        # 06-BILLING
   ```

3. **命名規則の統一**

   - コンポーネント: `{Feature}List`, `{Feature}Form`, `{Feature}Card`, `{Feature}Detail`
   - API: `/api/{feature}`, `/api/{feature}/[id]`
   - 型: `{Feature}`, `{Feature}Input`, `{Feature}Status`

4. **機能フラグのチェック方法**

   ```typescript
   // すべての機能で統一したパターンを使用
   const hasMeterReadings = useFeature("meter_readings");

   // 条件付きレンダリング
   {
     hasMeterReadings && <MeterSection />;
   }

   // 条件付きルーティング（middleware or layout）
   ```

5. **修正しやすさの確保**
   - 1 ファイル = 1 責任（Single Responsibility）
   - マジックナンバー/文字列は定数化
   - 共通ロジックは hooks/ または lib/ に抽出

### FEATURES 追加時のチェックリスト

新しい機能を実装する際は、以下を確認：

- [ ] 機能フラグで制御されているか
- [ ] 独立したディレクトリに配置されているか
- [ ] 命名規則に従っているか
- [ ] 共通コンポーネント（Button, Input 等）を再利用しているか
- [ ] 型定義が types/ に追加されているか
- [ ] API エンドポイントが RESTful か

---

## 1. 概要

### 1.1 対象機能フラグ

| フラグ                | 機能               | 依存           |
| --------------------- | ------------------ | -------------- |
| `meter_readings`      | メーター入力・管理 | -              |
| `variable_fees`       | 変動料金計算       | meter_readings |
| `custom_fee_types`    | カスタム料金タイプ | -              |
| `tenant_meter_submit` | 入居者メーター提出 | meter_readings |

### 1.2 関連テーブル（`01-DATABASE.md` 参照）

- `fee_types` - 料金タイプマスタ
- `unit_fees` - 部屋別料金設定
- `meter_readings` - メーター読み取り記録
- `tenant_meter_submissions` - 入居者提出

### 1.3 ファイル構造

```
components/features/
├── meter/
│   ├── MeterReadingList.tsx
│   ├── MeterReadingForm.tsx
│   ├── MeterBulkInput.tsx
│   └── MeterSubmissionReview.tsx
├── fee-types/
│   ├── FeeTypeList.tsx
│   └── FeeTypeForm.tsx
└── tenant-portal/
    └── MeterSubmitForm.tsx
```

---

## 2. 料金タイプ管理

> **機能フラグ**: `custom_fee_types`

### 2.1 料金タイプ一覧画面

**パス**: `/dashboard/settings/fee-types`

**表示項目**:
| 項目 | 説明 |
|------|------|
| 名前 | 料金タイプ名（例: 水道代、管理費） |
| 計算方式 | 固定 / m² 単価 / メーター / カスタム |
| 単位 | ₮, ₮/m³, ₮/m² など |
| デフォルト金額 | 初期設定金額 |
| 状態 | 有効 / 無効 |

**アクション**:

- 新規追加
- засах
- 有効/無効切り替え
- 並び順変更（ドラッグ&ドロップ）

### 2.2 料金タイプ登録・засах

**フォーム項目**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| name | string | ✅ | 料金名 |
| calculation_type | select | ✅ | 'fixed' \| 'per_sqm' \| 'metered' \| 'custom' |
| unit_label | string | - | 表示単位（例: ₮/m³） |
| default_amount | number | - | 固定金額（fixed 時） |
| default_unit_price | number | - | 単価（metered 時） |
| is_active | boolean | ✅ | デフォルト: true |
| display_order | number | - | 表示順 |

### 2.3 計算方式の説明

| 方式      | 説明         | 計算式                               |
| --------- | ------------ | ------------------------------------ |
| `fixed`   | 固定金額     | `default_amount`                     |
| `per_sqm` | Талбай 単価  | `unit.area_sqm × default_unit_price` |
| `metered` | メーター従量 | `consumption × unit_price`           |
| `custom`  | カスタム     | 手動入力                             |

### 2.4 デフォルト料金タイプ（会社作成時に自動生成）

| 名前   | calculation_type | unit_label | default_amount |
| ------ | ---------------- | ---------- | -------------- |
| 管理費 | fixed            | ₮          | 50,000         |
| 水道代 | metered          | ₮/m³       | -              |
| ゴミ代 | fixed            | ₮          | 10,000         |

---

## 3. メーター入力

> **機能フラグ**: `meter_readings`

### 3.1 メーター入力画面

**パス**: `/dashboard/meter-readings`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ メーター入力                           [一括入力] [履歴]    │
├─────────────────────────────────────────────────────────────┤
│ 物件: [▼ 選択]    料金タイプ: [▼ 水道代]    月: [2024-01]  │
├─────────────────────────────────────────────────────────────┤
│ 部屋   │ 前回    │ 今回    │ 使用量  │ 単価   │ 金額      │
│────────┼─────────┼─────────┼─────────┼────────┼───────────│
│ 101    │ 123.4   │ [     ] │ -       │ 2,500  │ -         │
│ 102    │ 234.5   │ [     ] │ -       │ 2,500  │ -         │
│ 103    │ 345.6   │ [     ] │ -       │ 2,500  │ -         │
├─────────────────────────────────────────────────────────────┤
│                                           [Хадгалах]            │
└─────────────────────────────────────────────────────────────┘
```

**機能**:

- 物件選択で Өрөөний жагсаалт をフィルター
- 料金タイプ選択（メーター式のみ）
- 前回値は自動取得
- 今回値入力で使用量・金額を自動計算
- 一括 Хадгалах

### 3.2 一括入力画面

**パス**: `/dashboard/meter-readings/bulk`

**フロー**:

1. 物件・料金タイプ・月を選択
2. 全部屋が一覧表示（前回値付き）
3. 今回値を入力（Tab/Enter で次へ移動）
4. 一括 Хадгалах

**バリデーション**:

- 今回値 ≥ 前回値（減少はエラー）
- 空欄はスキップ可

### 3.3 メーター履歴画面

**パス**: `/dashboard/meter-readings/history`

**フィルター**:

- 物件
- 部屋
- 料金タイプ
- 期間（開始月〜終了月）

**表示項目**:
| 項目 | 説明 |
|------|------|
| 日付 | 読み取り日 |
| 部屋 | 部屋番号 |
| 前回値 | previous_reading |
| 今回値 | current_reading |
| 使用量 | consumption（自動計算） |
| 金額 | total_amount（自動計算） |
| 記録者 | 入力したユーザー |

### 3.4 メーター入力のビジネスロジック

**前回値の取得**:

```
同じ unit_id + fee_type_id で
reading_date が最新のレコードの current_reading
→ なければ 0
```

**使用量の計算**:

```
consumption = current_reading - previous_reading
```

**金額の計算**:

```
total_amount = consumption × unit_price
```

**unit_price の決定順序**:

1. `unit_fees.custom_unit_price`（部屋別設定があれば）
2. `fee_types.default_unit_price`（なければデフォルト）

---

## 4. 入居者メーター提出

> **機能フラグ**: `tenant_meter_submit`（`meter_readings` も必要）

### 4.1 入居者側：メーター提出画面

**パス**: `/tenant/meter-submit`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ メーター提出                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  部屋: 101号室                                              │
│                                                             │
│  水道メーター                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 前回値: 123.4 m³                                    │   │
│  │                                                     │   │
│  │ 今回値: [           ] m³                            │   │
│  │                                                     │   │
│  │ 写真: [ファイル選択] または [カメラ起動]            │   │
│  │                                                     │   │
│  │ メモ: [                                  ]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                    [提出]                   │
│                                                             │
│  ───────────────────────────────────────────────────────   │
│  提出履歴                                                   │
│  • 2024-01-05 提出 → 承認済み                              │
│  • 2023-12-03 提出 → 承認済み                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**入力項目**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|:----:|------|
| submitted_reading | number | ✅ | メーター値 |
| photo | file | - | 証拠写真（推奨） |
| notes | string | - | メモ |

**バリデーション**:

- 今回値 ≥ 前回値
- 同月に未承認の提出がある場合は再提出不可

### 4.2 管理会社側：提出確認画面

**パス**: `/dashboard/meter-readings/submissions`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ メーター提出確認                     [未確認のみ表示: ✓]    │
├─────────────────────────────────────────────────────────────┤
│ 部屋   │ 入居者   │ 提出値  │ 前回値  │ 差分   │ 状態     │
│────────┼──────────┼─────────┼─────────┼────────┼──────────│
│ 101    │ 山田太郎 │ 135.2   │ 123.4   │ +11.8  │ [承認][却下] │
│ 203    │ 鈴木花子 │ 456.7   │ 445.0   │ +11.7  │ [承認][却下] │
└─────────────────────────────────────────────────────────────┘
```

**アクション**:

- **承認**: `meter_readings` にレコード作成、`status = 'approved'`
- **却下**: `status = 'rejected'`、理由を入力

### 4.3 提出ステータス遷移

```
┌──────────┐    承認     ┌──────────┐
│ pending  │───────────▶│ approved │
│  (提出)  │            │  (承認)  │
└────┬─────┘            └──────────┘
     │
     │ 却下
     ▼
┌──────────┐
│ rejected │
│  (却下)  │
└──────────┘
```

---

## 5. 変動料金計算

> **機能フラグ**: `variable_fees`

### 5.1 部屋別料金設定画面

**パス**: `/dashboard/properties/[id]/units/[unitId]/fees`

**目的**: 部屋ごとに料金をカスタマイズ

**表示内容**:
| 料金タイプ | デフォルト | この部屋の設定 | アクション |
|-----------|-----------|---------------|-----------|
| 管理費 | ₮50,000 | - | [カスタム設定] |
| 水道代 | ₮2,500/m³ | ₮2,000/m³ | [засах][削除] |
| ゴミ代 | ₮10,000 | - | [カスタム設定] |

### 5.2 請求生成時の計算フロー

```
1. 部屋の全料金タイプを取得
   ↓
2. 各料金タイプで計算
   ├── fixed: unit_fees.custom_amount ?? fee_types.default_amount
   ├── per_sqm: unit.area_sqm × (unit_fees.custom_unit_price ?? fee_types.default_unit_price)
   ├── metered: 該当月の meter_readings.total_amount
   └── custom: 手動入力
   ↓
3. billing_items としてХадгалах
   ↓
4. 合計 → billings.total_amount
```

---

## 6. API エンドポイント

### 6.1 料金タイプ API

| メソッド | パス                     | 説明       |
| -------- | ------------------------ | ---------- |
| GET      | `/api/fee-types`         | 一覧取得   |
| POST     | `/api/fee-types`         | 新規作成   |
| PUT      | `/api/fee-types/[id]`    | 更新       |
| PUT      | `/api/fee-types/reorder` | 並び順変更 |

### 6.2 メーター API

| メソッド | パス                             | 説明                       |
| -------- | -------------------------------- | -------------------------- |
| GET      | `/api/meter-readings`            | 履歴取得（フィルター付き） |
| POST     | `/api/meter-readings`            | 単一登録                   |
| POST     | `/api/meter-readings/bulk`       | 一括登録                   |
| GET      | `/api/units/[id]/latest-reading` | 部屋の最新メーター値       |

### 6.3 入居者提出 API

| メソッド | パス                                  | 説明                 |
| -------- | ------------------------------------- | -------------------- |
| GET      | `/api/tenant/meter-submissions`       | 自分の提出履歴       |
| POST     | `/api/tenant/meter-submissions`       | 新規提出             |
| GET      | `/api/meter-submissions`              | 管理会社: 全提出一覧 |
| POST     | `/api/meter-submissions/[id]/approve` | 承認                 |
| POST     | `/api/meter-submissions/[id]/reject`  | 却下                 |

### 6.4 部屋別料金 API

| メソッド | パス                   | 説明           |
| -------- | ---------------------- | -------------- |
| GET      | `/api/units/[id]/fees` | 部屋の料金設定 |
| PUT      | `/api/units/[id]/fees` | 料金設定更新   |

---

## 7. 入力型定義

```typescript
interface FeeTypeInput {
  name: string; // required
  calculation_type: "fixed" | "per_sqm" | "metered" | "custom";
  unit_label?: string;
  default_amount?: number;
  default_unit_price?: number;
  is_active?: boolean; // default: true
  display_order?: number;
}

interface MeterReadingInput {
  unit_id: string; // required
  fee_type_id: string; // required
  reading_date: string; // required, YYYY-MM-DD
  previous_reading: number; // required
  current_reading: number; // required, >= previous_reading
  unit_price: number; // required
  notes?: string;
}

interface MeterBulkInput {
  property_id: string; // required
  fee_type_id: string; // required
  reading_date: string; // required
  readings: {
    unit_id: string;
    current_reading: number;
  }[];
}

interface TenantMeterSubmissionInput {
  unit_id: string; // required
  fee_type_id: string; // required
  submitted_reading: number; // required
  photo_url?: string;
  notes?: string;
}

interface UnitFeeInput {
  fee_type_id: string; // required
  custom_amount?: number;
  custom_unit_price?: number;
  is_active?: boolean;
}
```

---

## 8. 画面アクセス制御

```typescript
// 機能フラグによる表示制御

// サイドバー
{
  useFeature("meter_readings") && (
    <NavItem href="/dashboard/meter-readings">メーター入力</NavItem>
  );
}

// 設定メニュー
{
  useFeature("custom_fee_types") && (
    <NavItem href="/dashboard/settings/fee-types">料金タイプ</NavItem>
  );
}

// 入居者ポータル
{
  useFeature("tenant_meter_submit") && (
    <NavItem href="/tenant/meter-submit">メーター提出</NavItem>
  );
}
```

---

**Document Version**: 1.0  
**Previous**: `03-CORE-PROPERTY.md`  
**Next**: `05-OFFICE-FEATURES.md`
