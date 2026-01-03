# 08 - システム管理者機能

## Claude Code Implementation Guide - System Administration

> **Note**: システム管理者は全会社・全ユーザーを管理する最上位権限
> 他のすべてのドキュメントより上位の権限を持つ

---

## ⚠️ Claude Code への最重要注意点

### システム管理者の役割

```
┌─────────────────────────────────────────────────────────────┐
│                    PropertyHub 権限構造                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              システム管理者 (08-ADMIN)               │   │
│  │  • 全会社の管理                                      │   │
│  │  • 機能フラグの制御                                  │   │
│  │  • サブスクリプション管理                            │   │
│  │  • システム全体の設定                                │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  会社A     │  │  会社B     │  │  会社C     │            │
│  │ (03-07)   │  │ (03-07)   │  │ (03-07)   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 実装時の絶対ルール

1. **完全な分離**: 管理者画面は `/admin/*` に完全分離
2. **二重認証**: `system_admins` テーブルでの確認必須
3. **監査ログ**: 全操作を `admin_audit_logs` に記録
4. **RLS 超越**: 管理者は全データにアクセス可能（Service Role 使用）
5. **操作確認**: 危険な操作は二重確認（会社削除等）

### セキュリティ最優先事項

```typescript
// 全管理者APIで必須のチェック
async function requireSystemAdmin(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: admin } = await supabase
    .from("system_admins")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!admin) throw new Error("Not a system admin");

  return admin;
}
```

---

## 1. 概要

### 1.1 システム管理者の責務

| 責務                   | 説明                            |
| ---------------------- | ------------------------------- |
| 会社管理               | 全会社の一覧・詳細・засах・停止 |
| 機能フラグ管理         | 会社ごとの機能 ON/OFF           |
| サブスクリプション管理 | プラン・制限・課金              |
| ユーザー管理           | 管理者ユーザーの追加・削除      |
| システム設定           | グローバル設定、デフォルト値    |
| 監査・ログ             | 操作履歴の確認                  |
| 統計・分析             | システム全体の利用状況          |

### 1.2 関連テーブル（`01-DATABASE.md` 参照）

- `system_admins` - システム管理者
- `companies` - 全会社
- `subscriptions` - サブスクリプション
- `admin_audit_logs` - 監査ログ（新規）

### 1.3 ファイル構造

```
app/
└── (admin)/
    └── admin/
        ├── layout.tsx           # 管理者レイアウト（認証チェック）
        ├── dashboard/
        │   └── page.tsx         # 管理者ダッシュボード
        ├── companies/
        │   ├── page.tsx         # 会社一覧
        │   └── [id]/
        │       ├── page.tsx     # 会社詳細
        │       ├── features/    # 機能フラグ
        │       └── subscription/# サブスク
        ├── admins/
        │   └── page.tsx         # 管理者ユーザー管理
        ├── settings/
        │   └── page.tsx         # システム設定
        └── logs/
            └── page.tsx         # 監査ログ

components/features/
└── admin/
    ├── AdminSidebar.tsx
    ├── CompanyList.tsx
    ├── CompanyDetail.tsx
    ├── FeatureFlagsEditor.tsx
    ├── SubscriptionEditor.tsx
    ├── AdminUserList.tsx
    └── AuditLogViewer.tsx

lib/
└── admin/
    ├── require-admin.ts        # 認証ヘルパー
    └── audit-log.ts            # ログ記録ヘルパー
```

---

## 2. 管理者ダッシュボード

### 2.1 ダッシュボード画面

**パス**: `/admin/dashboard`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ システム管理                                    [user@admin] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  システム概要                                               │
│  ─────────────────────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 会社数   │ │ 物件数   │ │ Өрөөний тоо   │ │入居者数  │       │
│  │   125    │ │   580    │ │  4,230   │ │  3,890   │       │
│  │ +5 今月 │ │ +23 今月│ │+180 今月│ │+145 今月│       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 請求総額 │ │ 入金総額 │ │ 未収金   │ │MRR       │       │
│  │ ₮850M   │ │ ₮720M   │ │ ₮130M   │ │ ₮15M    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                             │
│  要対応                                                     │
│  ─────────────────────────────────────────────────────────  │
│  ⚠️ 3件の会社がサブスク期限切れ間近                         │
│  ⚠️ 1件の会社が制限超過                                     │
│                                                             │
│  最近の登録会社                                             │
│  ─────────────────────────────────────────────────────────  │
│  • ABC不動産 (2024-03-15) - アパート - Free                │
│  • XYZОффис (2024-03-14) - Оффис - Basic             │
│  • サンプル管理 (2024-03-12) - アパート - Free              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 統計データ

| 項目        | 計算方法                                                        |
| ----------- | --------------------------------------------------------------- |
| 会社数      | COUNT(companies)                                                |
| 物件数      | COUNT(properties)                                               |
| Өрөөний тоо | COUNT(units)                                                    |
| 入居者数    | COUNT(tenants) WHERE is_active = true                           |
| 請求総額    | SUM(billings.total_amount) 今月                                 |
| 入金総額    | SUM(payments.amount) 今月                                       |
| 未収金      | SUM(billings.total_amount - paid_amount) WHERE status != 'paid' |
| MRR         | SUM(subscriptions.price_per_month) WHERE status = 'active'      |

---

## 3. 会社管理

### 3.1 会社一覧画面

**パス**: `/admin/companies`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ 会社管理                               [エクスポート] [+新規] │
├─────────────────────────────────────────────────────────────┤
│ 検索: [          ]  タイプ: [全て▼]  プラン: [全て▼]        │
├─────────────────────────────────────────────────────────────┤
│ 会社名       │ タイプ   │ プラン  │ 物件 │ 部屋  │ 状態    │
│──────────────┼──────────┼─────────┼──────┼───────┼─────────│
│ ABC不動産    │アパート  │ Basic  │ 3    │ 45   │ ● 有効  │
│ XYZОффис  │Оффис  │ Pro    │ 5    │ 120  │ ● 有効  │
│ サンプル管理 │アパート  │ Free   │ 1    │ 12   │ ○ 制限超│
│ 休止会社     │Оффис  │ -      │ 0    │ 0    │ ✕ 停止  │
└─────────────────────────────────────────────────────────────┘
```

**表示項目**:
| 項目 | 説明 |
|------|------|
| 会社名 | クリックで詳細へ |
| タイプ | apartment / office |
| プラン | Free / Basic / Pro / Enterprise |
| 物件数 | COUNT(properties) |
| Өрөөний тоо | COUNT(units) |
| 状態 | 有効 / 制限超過 / 停止 |

**フィルター**:

- 会社名検索
- 会社タイプ
- プラン
- 状態

### 3.2 会社詳細画面

**パス**: `/admin/companies/[id]`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ 会社詳細: ABC不動産                [засах] [停止] [削除]     │
├─────────────────────────────────────────────────────────────┤
│ ┌─ 基本情報 ──────────────────────────────────────────────┐ │
│ │ 会社名: ABC不動産                                       │ │
│ │ タイプ: アパート管理                                    │ │
│ │ メール: info@abc-fudosan.mn                            │ │
│ │ 電話: 99-1234-5678                                      │ │
│ │ 登録日: 2024-01-15                                      │ │
│ │ 状態: ● 有効                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 利用状況 ──────────────────────────────────────────────┐ │
│ │ 物件: 3 / 5 (上限)                                     │ │
│ │ 部屋: 45 / 100 (上限)                                  │ │
│ │ ユーザー: 2名                                          │ │
│ │ 入居者: 38名                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ サブスクリプション ────────────────────────────────────┐ │
│ │ プラン: Basic (₮50,000/月)                             │ │
│ │ 開始: 2024-01-15                                        │ │
│ │ 次回請求: 2024-04-15                      [変更]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 機能フラグ ────────────────────────────────────────────┐ │
│ │ ☑ meter_readings    ☑ tenant_portal                   │ │
│ │ ☑ variable_fees     □ reports_advanced                │ │
│ │ ☑ email_notif...    □ api_access                      │ │
│ │                                           [засах]       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 管理者ユーザー ────────────────────────────────────────┐ │
│ │ • tanaka@abc.mn (admin) - 最終ログイン: 2024-03-15     │ │
│ │ • suzuki@abc.mn (staff) - 最終ログイン: 2024-03-10     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─ 操作履歴（直近5件）────────────────────────────────────┐ │
│ │ 2024-03-15 10:30 機能フラグ変更 by admin@system        │ │
│ │ 2024-03-01 09:00 プラン変更 Free→Basic by admin@system │ │
│ │ ...                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 会社の状態管理

| 状態     | 条件                | 影響                       |
| -------- | ------------------- | -------------------------- |
| 有効     | 通常                | 全機能利用可               |
| 制限超過 | 物件/部屋が上限超過 | 新規追加不可、既存は利用可 |
| 停止     | 管理者が手動停止    | ログイン不可               |
| 削除     | 管理者が削除        | データ完全削除（復元不可） |

### 3.4 会社停止処理

**トリガー**: 詳細画面の「停止」ボタン

**処理内容**:

1. 確認ダイアログ（理由入力必須）
2. `companies.is_active = false`
3. 全 `company_users` を無効化
4. 監査ログに記録

**影響**:

- 管理会社ユーザーはログイン不可
- 入居者もログイン不可
- データは保持

### 3.5 会社削除処理

**トリガー**: 詳細画面の「削除」ボタン

**二重確認**:

1. 確認ダイアログ（会社名を手入力）
2. 削除理由入力

**処理内容**:

```
1. 関連データを順次削除（外部キー制約の順序に注意）
   - payments
   - billing_items
   - billings
   - meter_readings
   - tenant_meter_submissions
   - leases
   - unit_fees
   - units
   - properties
   - tenants（Supabase Authユーザーも削除）
   - company_users（Supabase Authユーザーも削除）
   - subscriptions
   - documents
   - maintenance_requests
   - notifications_queue
   - company_notification_settings
   - fee_types
   - floors
   - companies

2. 監査ログに記録（削除後も参照可能なよう別テーブル）
```

**⚠️ 警告**: この操作は取り消せません

---

## 4. 機能フラグ管理

### 4.1 機能フラグ засах 画面

**パス**: `/admin/companies/[id]/features`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ 機能フラグ: ABC不動産                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 物件管理                                                    │
│ ─────────────────────────────────────────────────────────── │
│ ☑ multi_property     複数物件管理                          │
│ □ floor_plan         ビジュアルフロアプラン                 │
│                                                             │
│ アパート機能                                                │
│ ─────────────────────────────────────────────────────────── │
│ ☑ meter_readings     メーター入力                          │
│ ☑ variable_fees      変動料金                              │
│ ☑ custom_fee_types   カスタム料金タイプ                    │
│                                                             │
│ Оффис機能                                                │
│ ─────────────────────────────────────────────────────────── │
│ □ lease_management   詳細契約管理                          │
│ □ lease_documents    契約書管理                            │
│                                                             │
│ Засвартай                                                │
│ ─────────────────────────────────────────────────────────── │
│ ☑ maintenance_basic  基本Засвартай                      │
│ □ maintenance_vendor 業者管理                              │
│                                                             │
│ 入居者ポータル                                              │
│ ─────────────────────────────────────────────────────────── │
│ ☑ tenant_portal      入居者ポータル                        │
│ ☑ tenant_meter_submit メーター提出                         │
│                                                             │
│ 通知                                                        │
│ ─────────────────────────────────────────────────────────── │
│ ☑ email_notifications メール通知                           │
│ □ sms_notifications   SMS通知                              │
│                                                             │
│ 高度な機能                                                  │
│ ─────────────────────────────────────────────────────────── │
│ □ reports_advanced    詳細レポート                         │
│ □ api_access          API アクセス                         │
│                                                             │
│                              [リセット] [Хадгалах]              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 機能フラグのプリセット

| プラン     | 含まれる機能                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Free       | multi_property(1), maintenance_basic, tenant_portal, email_notifications                                       |
| Basic      | Free + meter_readings, variable_fees, custom_fee_types, tenant_meter_submit                                    |
| Pro        | Basic + floor_plan, lease_management, lease_documents, maintenance_vendor, sms_notifications, reports_advanced |
| Enterprise | Pro + api_access + カスタム                                                                                    |

### 4.3 機能フラグ変更の影響

**即時反映**: 変更後、次回のページロードから反映

**注意点**:

- 機能を OFF にしても既存データは削除されない
- 再度 ON にすれば以前のデータが表示される

---

## 5. サブスクリプション管理

### 5.1 サブスク засах 画面

**パス**: `/admin/companies/[id]/subscription`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ サブスクリプション: ABC不動産                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 現在のプラン                                                │
│ ─────────────────────────────────────────────────────────── │
│ プラン: [Basic      ▼]                                     │
│                                                             │
│ 料金                                                        │
│ ─────────────────────────────────────────────────────────── │
│ 月額: ₮[50,000    ]                                        │
│                                                             │
│ 制限                                                        │
│ ─────────────────────────────────────────────────────────── │
│ 最大物件数: [5       ]  現在: 3                            │
│ 最大Өрөөний тоо: [100     ]  現在: 45                           │
│                                                             │
│ 期間                                                        │
│ ─────────────────────────────────────────────────────────── │
│ 開始日: 2024-01-15                                          │
│ 終了日: [          ] (空=無期限)                           │
│                                                             │
│ ステータス                                                  │
│ ─────────────────────────────────────────────────────────── │
│ ステータス: [active ▼]                                     │
│                                                             │
│ 備考                                                        │
│ ─────────────────────────────────────────────────────────── │
│ [                                                  ]        │
│                                                             │
│                                        [キャンセル] [Хадгалах]  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 プラン定義

| プラン     | 月額     | 物件上限 | 部屋上限 |
| ---------- | -------- | -------- | -------- |
| Free       | ₮0       | 1        | 50       |
| Basic      | ₮50,000  | 5        | 200      |
| Pro        | ₮150,000 | 20       | 1,000    |
| Enterprise | カスタム | 無制限   | 無制限   |

### 5.3 サブスクステータス

| ステータス | 説明           |
| ---------- | -------------- |
| active     | 有効           |
| trial      | トライアル期間 |
| past_due   | 支払い遅延     |
| cancelled  | キャンセル     |
| suspended  | 一時停止       |

---

## 6. 管理者ユーザー管理

### 6.1 管理者一覧画面

**パス**: `/admin/admins`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ システム管理者                                    [+ 追加]  │
├─────────────────────────────────────────────────────────────┤
│ 名前         │ メール              │ 権限    │ 状態       │
│──────────────┼─────────────────────┼─────────┼────────────│
│ Admin User   │ admin@propertyhub.mn│ super   │ ● 有効    │
│ Support      │ support@property... │ support │ ● 有効    │
│ Old Admin    │ old@propertyhub.mn  │ support │ ○ 無効    │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 管理者権限レベル

| 権限    | 説明           | 操作範囲                             |
| ------- | -------------- | ------------------------------------ |
| super   | スーパー管理者 | 全操作可能、他の管理者の管理も可     |
| admin   | 管理者         | 会社・サブスク管理可、管理者追加不可 |
| support | サポート       | 閲覧のみ、засах 不可                 |

### 6.3 管理者追加

**フォーム項目**:
| フィールド | 型 | 必須 |
|-----------|-----|:----:|
| email | string | ✅ |
| name | string | ✅ |
| password | string | ✅ |
| role | select | ✅ |

**処理**:

1. Supabase Auth にユーザー作成
2. `system_admins` テーブルに追加
3. 監査ログに記録

---

## 7. 監査ログ

### 7.1 監査ログ画面

**パス**: `/admin/logs`

**表示内容**:

```
┌─────────────────────────────────────────────────────────────┐
│ 監査ログ                                      [エクスポート] │
├─────────────────────────────────────────────────────────────┤
│ 期間: [2024-03-01] 〜 [2024-03-15]  操作者: [全員▼]        │
├─────────────────────────────────────────────────────────────┤
│ 日時              │ 操作者      │ 操作        │ 対象       │
│───────────────────┼─────────────┼─────────────┼────────────│
│ 2024-03-15 10:30 │ admin@...   │ 機能変更    │ ABC不動産  │
│ 2024-03-15 09:15 │ admin@...   │ 会社停止    │ XYZ社      │
│ 2024-03-14 16:00 │ support@... │ 閲覧        │ DEF社      │
│ 2024-03-14 14:30 │ admin@...   │ プラン変更  │ ABC不動産  │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 監査ログテーブル

```sql
CREATE TABLE admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 操作者
    admin_id UUID REFERENCES system_admins(id),
    admin_email TEXT NOT NULL,

    -- 操作内容
    action TEXT NOT NULL,
    -- 'company_view', 'company_edit', 'company_suspend', 'company_delete',
    -- 'features_change', 'subscription_change',
    -- 'admin_create', 'admin_edit', 'admin_delete',
    -- 'settings_change'

    -- 対象
    target_type TEXT, -- 'company', 'admin', 'settings'
    target_id UUID,
    target_name TEXT,

    -- 変更内容
    old_value JSONB,
    new_value JSONB,

    -- メタデータ
    ip_address TEXT,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_logs_target ON admin_audit_logs(target_type, target_id);
```

### 7.3 記録対象操作

| 操作           | action 値           | 記録内容               |
| -------------- | ------------------- | ---------------------- |
| 会社閲覧       | company_view        | -                      |
| 会社 засах     | company_edit        | old_value, new_value   |
| 会社停止       | company_suspend     | 理由                   |
| 会社削除       | company_delete      | 削除前データのサマリー |
| 機能フラグ変更 | features_change     | old_value, new_value   |
| サブスク変更   | subscription_change | old_value, new_value   |
| 管理者追加     | admin_create        | 新規管理者情報         |
| 管理者削除     | admin_delete        | 削除対象情報           |
| 設定変更       | settings_change     | old_value, new_value   |

---

## 8. システム設定

### 8.1 設定画面

**パス**: `/admin/settings`

**設定項目**:

```
┌─────────────────────────────────────────────────────────────┐
│ システム設定                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ プラン設定                                                  │
│ ─────────────────────────────────────────────────────────── │
│ Free プラン:                                                │
│   物件上限: [1    ]  部屋上限: [50   ]  月額: [0      ]    │
│ Basic プラン:                                               │
│   物件上限: [5    ]  部屋上限: [200  ]  月額: [50000  ]    │
│ Pro プラン:                                                 │
│   物件上限: [20   ]  部屋上限: [1000 ]  月額: [150000 ]    │
│                                                             │
│ デフォルト料金タイプ                                        │
│ ─────────────────────────────────────────────────────────── │
│ [засах] 管理費、水道代、ゴミ代...                           │
│                                                             │
│ メール設定                                                  │
│ ─────────────────────────────────────────────────────────── │
│ システム送信元: [noreply@propertyhub.mn]                   │
│                                                             │
│ その他                                                      │
│ ─────────────────────────────────────────────────────────── │
│ Засвартайモード: [OFF ▼]                                │
│                                                             │
│                                               [Хадгалах]        │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 設定テーブル

```sql
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES system_admins(id)
);

-- 初期データ例
INSERT INTO system_settings (key, value) VALUES
('plans', '{
    "free": {"max_properties": 1, "max_units": 50, "price": 0},
    "basic": {"max_properties": 5, "max_units": 200, "price": 50000},
    "pro": {"max_properties": 20, "max_units": 1000, "price": 150000}
}'),
('default_fee_types', '[
    {"name": "管理費", "calculation_type": "fixed", "default_amount": 50000},
    {"name": "水道代", "calculation_type": "metered", "unit_label": "₮/m³"},
    {"name": "ゴミ代", "calculation_type": "fixed", "default_amount": 10000}
]'),
('maintenance_mode', 'false');
```

---

## 9. API エンドポイント

### 9.1 会社管理 API

| メソッド | パス                                 | 説明       |
| -------- | ------------------------------------ | ---------- |
| GET      | `/api/admin/companies`               | 会社一覧   |
| GET      | `/api/admin/companies/[id]`          | 会社詳細   |
| PUT      | `/api/admin/companies/[id]`          | 会社 засах |
| POST     | `/api/admin/companies/[id]/suspend`  | 会社停止   |
| POST     | `/api/admin/companies/[id]/activate` | 会社再開   |
| DELETE   | `/api/admin/companies/[id]`          | 会社削除   |

### 9.2 機能フラグ API

| メソッド | パス                                       | 説明                 |
| -------- | ------------------------------------------ | -------------------- |
| GET      | `/api/admin/companies/[id]/features`       | 機能フラグ取得       |
| PUT      | `/api/admin/companies/[id]/features`       | 機能フラグ更新       |
| POST     | `/api/admin/companies/[id]/features/reset` | デフォルトにリセット |

### 9.3 サブスク API

| メソッド | パス                                     | 説明         |
| -------- | ---------------------------------------- | ------------ |
| GET      | `/api/admin/companies/[id]/subscription` | サブスク取得 |
| PUT      | `/api/admin/companies/[id]/subscription` | サブスク更新 |

### 9.4 管理者 API

| メソッド | パス                     | 説明         |
| -------- | ------------------------ | ------------ |
| GET      | `/api/admin/admins`      | 管理者一覧   |
| POST     | `/api/admin/admins`      | 管理者追加   |
| PUT      | `/api/admin/admins/[id]` | 管理者 засах |
| DELETE   | `/api/admin/admins/[id]` | 管理者削除   |

### 9.5 その他 API

| メソッド | パス                         | 説明               |
| -------- | ---------------------------- | ------------------ |
| GET      | `/api/admin/dashboard/stats` | ダッシュボード統計 |
| GET      | `/api/admin/logs`            | 監査ログ           |
| GET      | `/api/admin/settings`        | システム設定取得   |
| PUT      | `/api/admin/settings`        | システム設定更新   |

---

## 10. 入力型定義

```typescript
interface CompanyEditInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CompanySuspendInput {
  reason: string; // required
}

interface FeaturesUpdateInput {
  features: {
    [key: string]: boolean;
  };
}

interface SubscriptionUpdateInput {
  plan?: "free" | "basic" | "pro" | "enterprise";
  price_per_month?: number;
  max_properties?: number;
  max_units?: number;
  status?: "active" | "trial" | "past_due" | "cancelled" | "suspended";
  end_date?: string | null;
  notes?: string;
}

interface AdminCreateInput {
  email: string; // required
  name: string; // required
  password: string; // required
  role: "super" | "admin" | "support";
}

interface SystemSettingsInput {
  plans?: {
    free: PlanConfig;
    basic: PlanConfig;
    pro: PlanConfig;
  };
  default_fee_types?: FeeTypeConfig[];
  maintenance_mode?: boolean;
}

interface PlanConfig {
  max_properties: number;
  max_units: number;
  price: number;
}
```

---

## 11. セキュリティチェックリスト

| 項目         | 実装                             |
| ------------ | -------------------------------- |
| 認証チェック | 全 API で `requireSystemAdmin()` |
| 権限チェック | role に応じた操作制限            |
| 監査ログ     | 全操作を記録                     |
| 二重確認     | 削除操作は会社名入力必須         |
| レート制限   | 削除操作は 1 時間に 10 件まで    |
| IP 制限      | 本番環境では許可 IP のみ（任意） |

---

**Document Version**: 1.0  
**Previous**: `07-NOTIFICATIONS.md`  
**Next**: 実装開始
