# 統一不動産管理システム (PropertyHub)

## Claude Code Implementation Guide - Main Document

---

## 1. プロジェクト概要

### 1.1 システム名

**PropertyHub** - 統一不動産管理プラットフォーム

### 1.2 背景と目的

モンゴルの不動産管理業界では、アパートと Оффис ビルの管理が依然として紙ベースや Excel で行われている。本システムは以下を統合した SaaS プラットフォームを提供する：

- **アパート管理**: 管理費、水道代、ゴミ代などの変動料金管理
- **Оффис 賃貸管理**: フロアプラン、契約管理、Засвартай

### 1.3 ユーザー種類（3 種類のみ）

```
┌─────────────────────────────────────────────────────────────────┐
│                      ユーザー構成                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. システム管理者（私たち側）                                    │
│     └── SaaS全体の管理、会社の機能設定                          │
│                                                                 │
│  2. 不動産管理会社（クライアント）                               │
│     └── 物件・部屋・入居者・請求の管理                          │
│                                                                 │
│  3. 入居者/テナント（不動産を使用している人たち）                │
│     └── 自分の請求確認、メーター提出など                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

※ オーナー機能は実装しない
```

### 1.4 機能フラグ方式

`property_type`（apartment/office）は単なるラベル・デフォルトテンプレート。
実際の機能は `company.features` で個別に ON/OFF 可能。

```typescript
// 会社ごとの機能設定（システム管理者が設定可能）
company.features = {
  // 物件管理
  multi_property: true, // 複数物件管理
  floor_plan: false, // ビジュアルフロアプラン

  // 料金・請求
  meter_readings: true, // 水道メーター入力
  variable_fees: true, // 変動料金（m³計算など）
  custom_fee_types: true, // カスタム料金タイプ

  // 契約
  lease_management: false, // 詳細契約管理
  lease_documents: false, // 契約書管理

  // Засвартай
  maintenance_basic: true, // 基本Засвартай
  maintenance_vendor: false, // 業者管理・コスト追跡

  // ポータル
  tenant_portal: true, // 入居者ポータル
  tenant_meter_submit: true, // 入居者メーター提出

  // 通知
  email_notifications: true, // メール通知
  sms_notifications: false, // SMS通知

  // その他
  reports_advanced: false, // 詳細レポート
  api_access: false, // API連携
};
```

**デフォルトテンプレート:**

| 登録時の選択 | デフォルトで ON になる機能                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| アパート会社 | meter_readings, variable_fees, custom_fee_types, tenant_portal, tenant_meter_submit, maintenance_basic, email_notifications |
| Оффис 会社   | floor_plan, lease_management, lease_documents, maintenance_vendor, maintenance_basic, tenant_portal, email_notifications    |

→ システム管理者が後から個別に変更可能

---

## 2. 技術スタック

### 2.1 コア技術

| カテゴリ       | 技術                     | 備考                       |
| -------------- | ------------------------ | -------------------------- |
| フロントエンド | Next.js 14+ (App Router) | React 18, TypeScript       |
| スタイリング   | Tailwind CSS             | shadcn/ui コンポーネント   |
| バックエンド   | Next.js API Routes       | Server Actions             |
| データベース   | Supabase (PostgreSQL)    | RLS で行レベルセキュリティ |
| 認証           | Supabase Auth            | メール/パスワード          |
| ストレージ     | Supabase Storage         | 画像、ドキュメント         |
| ホスティング   | Vercel                   | Edge Functions             |

### 2.2 開発ツール

```bash
# パッケージ管理
pnpm

# コード品質
ESLint + Prettier

# バリデーション
Zod

# フォーム
React Hook Form

# データフェッチング
TanStack Query

# 状態管理
Zustand
```

---

## 3. 認証システム

### 3.1 管理会社の登録フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                    管理会社の登録                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【登録画面】ログイン画面の「登録」ボタンから                    │
│                                                                 │
│  フォーム項目:                                                   │
│  ├── 会社名（必須）                                             │
│  ├── メールアドレス（必須）← ログインに使用                     │
│  ├── パスワード（必須）← 最低8文字                              │
│  ├── 電話番号（必須）← 後でSMS認証用                            │
│  └── 会社タイプ選択（Оффис会社 or アパート会社）              │
│                                                                 │
│  登録フロー:                                                     │
│  1. フォーム入力                                                 │
│  2. supabase.auth.signUp() でアカウント作成                     │
│  3. 選択した会社タイプでデフォルト features を設定               │
│  4. 即座にダッシュボードへリダイレクト                          │
│                                                                 │
│  技術仕様:                                                       │
│  ├── 認証: Supabase Auth（メール + パスワード）                 │
│  ├── メール確認: 開発中はスキップ（Confirm email OFF）          │
│  └── ユーザーメタデータ: company_name, phone, role をХадгалах       │
│                                                                 │
│  将来の拡張（本番時）:                                           │
│  フォーム → SMS認証 → 支払い → 利用開始                         │
│  ※ 現段ДавхарではSMS認証と支払い機能は実装しない                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 入居者/テナントの登録フロー

```
┌─────────────────────────────────────────────────────────────────┐
│                   入居者/テナントの登録                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【重要】入居者は自分で登録できない。管理会社が作成する。        │
│                                                                 │
│  登録フロー:                                                     │
│  1. 管理会社が入居者情報を入力（名前、電話番号、部屋）          │
│  2. システムが初期パスワードを自動生成（8数字ランダム）         │
│  3. 管理会社が入居者に初期パスワードを伝える　　　　　　　       │
│  4. 入居者がログイン後、任意でパスワード変更可能                │
│                                                                 │
│  入居者追加フォーム（管理会社側）:                               │
│  ├── 名前（必須）                                               │
│  ├── 電話番号（必須）← ログインIDとして使用                     │
│  ├── 使用部屋（必須）← 物件内の部屋を選択                       │
│  └── パスワードは入力不要（システムが自動生成）                 │
│                                                                 │
│  入居者ログイン:                                                 │
│  ├── ログインID: 電話番号                                       │
│  ├── パスワード: 初期パスワード                                 │
│  └── パスワード変更: 任意（必須ではない）                       │
│                                                                 │
│  技術仕様:                                                       │
│  電話番号を偽装メールに変換してSupabase Authに登録              │
│  例: 99001234 → 99001234@tenant.propertyhub.mn                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 ログイン画面の構成

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                        PropertyHub                              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  [タブ: 管理会社] [タブ: 入居者]                        │   │
│  │                                                         │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  【管理会社タブの場合】                                  │   │
│  │  メールアドレス: [________________]                     │   │
│  │  パスワード:     [________________]                     │   │
│  │                                                         │   │
│  │  [ログイン]                                             │   │
│  │                                                         │   │
│  │  アカウントをお持ちでない場合 → [新規登録]              │   │
│  │                                                         │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  【入居者タブの場合】                                    │   │
│  │  電話番号:   [________________]                         │   │
│  │  パスワード: [________________]                         │   │
│  │                                                         │   │
│  │  [ログイン]                                             │   │
│  │                                                         │   │
│  │  ※ アカウントは管理会社から発行されます                 │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 主要機能サマリー

```
┌─────────────────────────────────────────────────────────────────┐
│                      PropertyHub 機能一覧                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    共通機能（常にON）                    │   │
│  │  • 物件管理（登録・засах・削除）                          │   │
│  │  • 部屋/ユニット管理                                     │   │
│  │  • 入居者/テナント管理                                   │   │
│  │  • 基本請求管理                                          │   │
│  │  • ダッシュボード                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              オプション機能（features で制御）           │   │
│  │                                                         │   │
│  │  【アパート向け】                                        │   │
│  │  • meter_readings: 水道メーター入力                     │   │
│  │  • variable_fees: 変動料金計算                          │   │
│  │  • custom_fee_types: カスタム料金タイプ                 │   │
│  │  • tenant_meter_submit: 入居者メーター提出              │   │
│  │                                                         │   │
│  │  【Оффис向け】                                        │   │
│  │  • floor_plan: ビジュアルフロアプラン                   │   │
│  │  • lease_management: 詳細契約管理                       │   │
│  │  • lease_documents: 契約書管理                          │   │
│  │  • maintenance_vendor: 業者管理・コスト追跡             │   │
│  │                                                         │   │
│  │  【共通オプション】                                      │   │
│  │  • maintenance_basic: 基本Засвартай                  │   │
│  │  • tenant_portal: 入居者ポータル                        │   │
│  │  • email_notifications: メール通知                      │   │
│  │  • sms_notifications: SMS通知                           │   │
│  │  • reports_advanced: 詳細レポート                       │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 システム管理者専用                       │   │
│  │  • 全会社の一覧・管理                                    │   │
│  │  • 会社ごとの features ON/OFF 設定                      │   │
│  │  • サブスクリプション管理                                │   │
│  │  • 使用統計                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 画面構成

### 5.1 URL 構造

```
/                               # ランディングページ（将来）
├── /login                      # ログイン（管理会社/入居者タブ切り替え）
├── /register                   # 管理会社の新規登録
│
├── /dashboard                  # 管理会社ダッシュボード
│   ├── /properties             # 物件一覧
│   │   ├── /new                # 物件登録
│   │   └── /[id]               # Барилгын дэлгэрэнгүй
│   │       ├── /units          # 部屋管理
│   │       ├── /floor-plan     # フロアプラン（機能ON時のみ）
│   │       └── /settings       # 物件設定
│   │
│   ├── /tenants                # 入居者一覧
│   │   ├── /new                # 入居者登録（パスワード自動生成）
│   │   └── /[id]               # 入居者詳細
│   │
│   ├── /leases                 # 契約管理（機能ON時のみ）
│   │
│   ├── /billings               # 請求管理
│   │   ├── /generate           # 請求生成
│   │   └── /[id]               # 請求詳細
│   │
│   ├── /meter-readings         # メーター入力（機能ON時のみ）
│   │   ├── /bulk               # 一括入力
│   │   └── /submissions        # 入居者提出確認
│   │
│   ├── /maintenance            # Засвартай（機能ON時のみ）
│   │
│   ├── /reports                # レポート
│   │
│   └── /settings               # 設定
│       ├── /company            # 会社情報
│       ├── /fee-types          # 料金タイプ（機能ON時のみ）
│       └── /users              # スタッフ管理
│
├── /tenant                     # 入居者ポータル（機能ON時のみ）
│   ├── /dashboard              # 入居者ダッシュボード
│   ├── /billings               # 自分の請求一覧
│   ├── /meter-submit           # メーター提出（機能ON時のみ）
│   └── /settings               # パスワード変更など
│
└── /admin                      # システム管理者
    ├── /dashboard              # 管理ダッシュボード
    ├── /companies              # 会社一覧
    │   └── /[id]               # 会社詳細（features設定）
    └── /subscriptions          # サブスクリプション管理
```

### 5.2 機能フラグによる表示制御

```typescript
// hooks/use-feature.ts
export function useFeature(featureName: string): boolean {
  const { company } = useCompany();
  return company?.features?.[featureName] ?? false;
}

// 使用例
function Sidebar() {
  const hasMeterReadings = useFeature("meter_readings");
  const hasFloorPlan = useFeature("floor_plan");

  return (
    <nav>
      <Link href="/dashboard">ダッシュボード</Link>
      <Link href="/properties">物件管理</Link>
      <Link href="/tenants">入居者管理</Link>
      <Link href="/billings">請求管理</Link>

      {hasMeterReadings && <Link href="/meter-readings">メーター入力</Link>}

      {hasFloorPlan && <Link href="/floor-plan">フロアプラン</Link>}
    </nav>
  );
}
```

---

## 6. プロジェクト構造

```
/property-hub
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx        # ログイン（タブ切り替え）
│   │   └── register/
│   │       └── page.tsx        # 管理会社登録
│   ├── (dashboard)/
│   │   ├── layout.tsx          # 管理会社レイアウト
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── tenants/
│   │   ├── billings/
│   │   ├── meter-readings/
│   │   ├── maintenance/
│   │   ├── reports/
│   │   └── settings/
│   ├── (tenant)/
│   │   ├── layout.tsx          # 入居者レイアウト
│   │   └── tenant/
│   ├── (admin)/
│   │   ├── layout.tsx          # システム管理者レイアウト
│   │   └── admin/
│   ├── api/
│   │   ├── auth/
│   │   ├── tenants/
│   │   └── ...
│   └── layout.tsx
│
├── components/
│   ├── ui/                     # shadcn/ui コンポーネント
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   └── ...
│   ├── forms/
│   └── features/
│       ├── properties/
│       ├── tenants/
│       ├── billings/
│       ├── meter/
│       ├── floor-plan/
│       └── maintenance/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── utils/
│   │   ├── password-generator.ts  # 初期パスワード生成
│   │   └── phone-to-email.ts      # 電話番号→偽装メール変換
│   └── validations/
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-company.ts
│   ├── use-feature.ts          # 機能フラグチェック
│   └── ...
│
├── types/
│   └── index.ts
│
├── docs/                       # この仕様書群
│   ├── 00-MAIN.md
│   ├── 01-DATABASE.md
│   ├── 02-AUTH.md
│   └── ...
│
└── supabase/
    └── migrations/
```

---

## 7. 実装フェーズ

### Phase 1: 基盤

```
□ Next.js プロジェクトセットアップ
□ Supabase プロジェクト作成
□ データベーススキーマ作成
□ 認証システム
  □ 管理会社登録
  □ 管理会社ログイン
  □ 入居者ログイン（電話番号）
□ 基本レイアウト
```

### Phase 2: 物件・入居者管理

```
□ 物件 CRUD
□ 部屋 CRUD
□ 入居者 CRUD（パスワード自動生成）
□ 契約管理（基本）
```

### Phase 3: 請求管理

```
□ 料金タイプ設定
□ 請求生成
□ 支払い管理
□ 請求履歴
```

### Phase 4: アパート専用機能

```
□ メーター入力
□ 変動料金計算
□ 入居者メーター提出
□ 入居者ポータル
```

### Phase 5: Оффис 専用機能

```
□ フロアプラン
□ 詳細契約管理
□ Засвартай管理
□ ドキュメント管理
```

### Phase 6: システム管理・仕上げ

```
□ システム管理者ダッシュボード
□ 会社の features 設定画面
□ 通知機能
□ テスト・バグ修正
□ デプロイ
```

---

## 8. 仕様書一覧

| ファイル                   | 内容                     | 状態    |
| -------------------------- | ------------------------ | ------- |
| `00-MAIN.md`               | 全体概要、アーキテクチャ | ✅ 完了 |
| `01-DATABASE.md`           | 統合データベーススキーマ | ✅ 完了 |
| `02-AUTH.md`               | 認証・権限管理           | ✅ 完了 |
| `03-CORE-PROPERTY.md`      | 物件・部屋管理（共通）   | ✅ 完了 |
| `04-APARTMENT-FEATURES.md` | アパート専用機能         | ✅ 完了 |
| `05-OFFICE-FEATURES.md`    | Оффис 専用機能           | ✅ 完了 |
| `06-BILLING.md`            | 請求・支払い管理         | ✅ 完了 |
| `07-NOTIFICATIONS.md`      | 通知システム             | ⏳ 予定 |
| `08-ADMIN.md`              | システム管理者機能       | ⏳ 予定 |

---

## 9. 環境変数

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PropertyHub

# 入居者メール偽装ドメイン
NEXT_PUBLIC_TENANT_EMAIL_DOMAIN=tenant.propertyhub.mn
```

---

**Document Version**: 2.0  
**Last Updated**: 2024  
**Next**: `01-DATABASE.md`
