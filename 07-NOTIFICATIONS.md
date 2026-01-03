# 07 - 通知システム

## Claude Code Implementation Guide - Notifications

> **Note**: 通知機能は `email_notifications` / `sms_notifications` フラグで制御
> 通知なしでもシステムは動作する（通知はオプション機能）

---

## ⚠️ Claude Code への注意点

### 1. 機能フラグによる制御

```typescript
// 通知送信前に必ずフラグチェック
if (useFeature('email_notifications')) {
    await sendEmail(...);
}

if (useFeature('sms_notifications')) {
    await sendSms(...);
}
```

### 2. 非同期処理

- 通知送信は**バックグラウンドジョブ**で実行
- メイン処理をブロックしない
- 送信失敗時はリトライキューに入れる

### 3. 送信頻度の制限

- 同一ユーザーへの同一タイプ通知は**1 日 1 回まで**
- 延滞リマインダーは**週 1 回まで**

### 4. 入居者の連絡先

- メール: `tenants.email`（任意項目、空の場合は送信スキップ）
- SMS: `tenants.phone`（必須項目）

---

## 1. 概要

### 1.1 対象機能フラグ

| フラグ                | 機能       | 説明                 |
| --------------------- | ---------- | -------------------- |
| `email_notifications` | メール通知 | 請求・リマインダー等 |
| `sms_notifications`   | SMS 通知   | 重要な通知のみ       |

### 1.2 通知タイプ一覧

| タイプ               | トリガー         | メール | SMS |
| -------------------- | ---------------- | :----: | :-: |
| 請求発行             | 請求生成時       |   ✅   |  -  |
| 支払期限リマインダー | 期限 3 日前      |   ✅   | ✅  |
| 延滞通知             | 延滞発生時       |   ✅   | ✅  |
| 支払確認             | 支払登録時       |   ✅   |  -  |
| 契約期限リマインダー | 期限 30 日前     |   ✅   |  -  |
| Засвартай 更新       | ステータス変更時 |   ✅   |  -  |
| 入居者アカウント作成 | 入居者登録時     |   -    | ✅  |

### 1.3 ファイル構造

```
lib/
├── notifications/
│   ├── index.ts           # メインエントリー
│   ├── email.ts           # メール送信
│   ├── sms.ts             # SMS送信
│   ├── templates/         # テンプレート
│   │   ├── billing-issued.ts
│   │   ├── payment-reminder.ts
│   │   ├── overdue-notice.ts
│   │   ├── payment-confirmed.ts
│   │   ├── lease-expiring.ts
│   │   └── maintenance-update.ts
│   └── queue.ts           # 送信キュー管理

app/api/
├── notifications/
│   ├── send/route.ts      # 手動送信
│   └── process/route.ts   # キュー処理（Cron）

components/features/
└── notifications/
    ├── NotificationSettings.tsx
    └── NotificationHistory.tsx
```

---

## 2. メール通知

### 2.1 メール送信サービス

**推奨**: Resend（シンプル、Supabase と相性良い）

**代替**: SendGrid, AWS SES, Postmark

### 2.2 メールテンプレート構造

各テンプレートは以下の形式:

```typescript
interface EmailTemplate {
  subject: string; // 件名
  body: {
    text: string; // プレーンテキスト版
    html: string; // HTML版
  };
}
```

### 2.3 テンプレート一覧

#### 請求発行通知

**トリガー**: 請求生成完了時

**件名**: `【PropertyHub】{month}分のご請求`

**本文内容**:

```
{tenant_name} 様

{month}分のご請求書を発行いたしました。

━━━━━━━━━━━━━━━━━━━━
請求番号: {billing_number}
対象期間: {billing_month}
請求金額: ₮{total_amount}
お支払期限: {due_date}
━━━━━━━━━━━━━━━━━━━━

詳細は入居者ポータルからご確認ください。
{portal_url}

--
{company_name}
```

#### 支払期限リマインダー

**トリガー**: 期限 3 日前（日次バッチ）

**件名**: `【リマインダー】お支払期限が近づいています`

**本文内容**:

```
{tenant_name} 様

以下のご請求のお支払期限が近づいております。

請求番号: {billing_number}
請求金額: ₮{total_amount}
お支払期限: {due_date}（あと{days_left}日）

お忘れなくお手続きください。

--
{company_name}
```

#### 延滞通知

**トリガー**: 延滞発生時（ステータス変更時）

**件名**: `【重要】お支払いが期限を過ぎています`

**本文内容**:

```
{tenant_name} 様

以下のご請求がお支払期限を過ぎております。
至急お手続きくださいますようお願いいたします。

請求番号: {billing_number}
請求金額: ₮{total_amount}
お支払期限: {due_date}（{days_overdue}日超過）

ご不明点がございましたら、管理会社までお問い合わせください。

--
{company_name}
TEL: {company_phone}
```

#### 支払確認通知

**トリガー**: 支払登録完了時

**件名**: `【PropertyHub】お支払いを確認しました`

**本文内容**:

```
{tenant_name} 様

以下のお支払いを確認いたしました。
ありがとうございました。

請求番号: {billing_number}
お支払金額: ₮{paid_amount}
お支払日: {payment_date}

{remaining_message}

--
{company_name}
```

**remaining_message**:

- 全額支払: 「今月分のお支払いは完了です。」
- 一部支払: 「残額 ₮{remaining} がございます。」

#### 契約期限リマインダー

**トリガー**: 契約終了 30 日前（日次バッチ）

**件名**: `【お知らせ】契約更新のご案内`

**本文内容**:

```
{tenant_name} 様

ご契約の更新時期が近づいております。

物件: {property_name} {unit_number}
契約終了日: {end_date}（あと{days_left}日）

契約更新のご意向がございましたら、管理会社までご連絡ください。

--
{company_name}
TEL: {company_phone}
```

---

## 3. SMS 通知

### 3.1 SMS 送信サービス

**モンゴル向け推奨**:

- Messagepro.mn
- Nexmo (Vonage)

### 3.2 SMS テンプレート（短縮版）

#### 支払期限リマインダー

```
【PropertyHub】{month}分 ₮{amount} のお支払期限が{due_date}です。詳細: {short_url}
```

#### 延滞通知

```
【重要】{month}分 ₮{amount} が未払いです。至急お支払いください。TEL:{phone}
```

#### アカウント作成通知

```
【PropertyHub】アカウントが作成されました。ID:{phone} PW:{password} ログイン:{url}
```

### 3.3 SMS 文字数制限

- 1 通: 160 文字（ASCII）/ 70 文字（日本語・キリル文字）
- 超過時は分割送信（コスト増）
- **70 文字以内を目標**

---

## 4. 通知キュー

### 4.1 キュー管理テーブル

```sql
-- notifications_queue テーブル
CREATE TABLE notifications_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id),

    -- 送信先
    recipient_type TEXT NOT NULL, -- 'tenant' | 'company_user'
    recipient_id UUID NOT NULL,

    -- 通知内容
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL, -- 'email' | 'sms'

    -- テンプレートデータ
    template_data JSONB NOT NULL,

    -- ステータス
    status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed' | 'skipped'
    attempts INT DEFAULT 0,
    last_error TEXT,

    -- 送信制御
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 キュー処理フロー

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ トリガー    │────▶│ キュー追加   │────▶│ Cron処理    │
│ (請求生成等)│     │ (pending)   │     │ (1分毎)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┘
                    │
                    ▼
              ┌───────────┐
              │ 送信実行  │
              └─────┬─────┘
                    │
         ┌─────────┼─────────┐
         │         │         │
         ▼         ▼         ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │  sent  │ │ failed │ │skipped │
    └────────┘ └────────┘ └────────┘
                    │
                    │ attempts < 3
                    ▼
              ┌───────────┐
              │  リトライ  │
              │ (15分後)  │
              └───────────┘
```

### 4.3 スキップ条件

| 条件       | 理由                                             |
| ---------- | ------------------------------------------------ |
| フラグ OFF | email_notifications / sms_notifications が false |
| 連絡先なし | メールアドレス / 電話番号が空                    |
| 重複送信   | 同一タイプ通知を 24 時間以内に送信済み           |
| 配信停止   | ユーザーが通知 OFF に設定（将来機能）            |

---

## 5. 日次バッチ処理

### 5.1 バッチ処理一覧

| 処理                 | 実行時間 | 説明                            |
| -------------------- | -------- | ------------------------------- |
| 支払期限リマインダー | 09:00    | 期限 3 日前の請求を抽出         |
| 延滞チェック         | 00:05    | 期限超過の請求を overdue に更新 |
| 契約期限リマインダー | 09:00    | 期限 30 日前の契約を抽出        |
| キュー再処理         | 毎分     | failed を再試行                 |

### 5.2 Cron 設定（Vercel Cron / Supabase Edge Functions）

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/payment-reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/overdue-check",
      "schedule": "5 0 * * *"
    },
    {
      "path": "/api/cron/lease-reminder",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/process-queue",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 6. 通知設定

### 6.1 管理会社の通知設定画面

**パス**: `/dashboard/settings/notifications`

**設定項目**:

```
┌─────────────────────────────────────────────────────────────┐
│ 通知設定                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ メール通知                                    [有効 ✓]      │
│ ─────────────────────────────────────────────────────────── │
│ □ 請求発行時に入居者へ通知                                 │
│ ☑ 支払期限リマインダー（3日前）                            │
│ ☑ 延滞通知                                                 │
│ ☑ 支払確認通知                                             │
│ ☑ 契約期限リマインダー（30日前）                           │
│                                                             │
│ SMS通知                                       [有効 ✓]      │
│ ─────────────────────────────────────────────────────────── │
│ □ 支払期限リマインダー                                     │
│ ☑ 延滞通知                                                 │
│ ☑ アカウント作成通知                                       │
│                                                             │
│ 送信元設定                                                  │
│ ─────────────────────────────────────────────────────────── │
│ 送信元メール: noreply@example.com                          │
│ 送信元名: サンプル管理会社                                  │
│                                                             │
│                                            [Хадгалах]           │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 通知設定テーブル

```sql
-- company_notification_settings
CREATE TABLE company_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) UNIQUE,

    -- メール設定
    email_billing_issued BOOLEAN DEFAULT true,
    email_payment_reminder BOOLEAN DEFAULT true,
    email_overdue_notice BOOLEAN DEFAULT true,
    email_payment_confirmed BOOLEAN DEFAULT true,
    email_lease_expiring BOOLEAN DEFAULT true,

    -- SMS設定
    sms_payment_reminder BOOLEAN DEFAULT false,
    sms_overdue_notice BOOLEAN DEFAULT true,
    sms_account_created BOOLEAN DEFAULT true,

    -- 送信元設定
    sender_email TEXT,
    sender_name TEXT,

    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. 通知履歴

### 7.1 通知履歴画面

**パス**: `/dashboard/notifications/history`

**表示項目**:
| 項目 | 説明 |
|------|------|
| 日時 | sent_at |
| タイプ | notification_type |
| チャネル | email / sms |
| 送信先 | 入居者名 + 連絡先 |
| ステータス | sent / failed / skipped |
| エラー | last_error（失敗時） |

**フィルター**:

- 期間
- チャネル
- ステータス
- 通知タイプ

---

## 8. API エンドポイント

### 8.1 通知 API

| メソッド | パス                         | 説明       |
| -------- | ---------------------------- | ---------- |
| POST     | `/api/notifications/send`    | 手動送信   |
| GET      | `/api/notifications/history` | 履歴取得   |
| GET      | `/api/notifications/queue`   | キュー状況 |

### 8.2 設定 API

| メソッド | パス                          | 説明     |
| -------- | ----------------------------- | -------- |
| GET      | `/api/settings/notifications` | 設定取得 |
| PUT      | `/api/settings/notifications` | 設定更新 |

### 8.3 Cron API

| メソッド | パス                         | 説明             |
| -------- | ---------------------------- | ---------------- |
| POST     | `/api/cron/payment-reminder` | 支払リマインダー |
| POST     | `/api/cron/overdue-check`    | 延滞チェック     |
| POST     | `/api/cron/lease-reminder`   | 契約リマインダー |
| POST     | `/api/cron/process-queue`    | キュー処理       |

---

## 9. 入力型定義

```typescript
interface NotificationQueueItem {
  recipient_type: "tenant" | "company_user";
  recipient_id: string;
  notification_type: NotificationType;
  channel: "email" | "sms";
  template_data: Record<string, any>;
  scheduled_at?: string;
}

type NotificationType =
  | "billing_issued"
  | "payment_reminder"
  | "overdue_notice"
  | "payment_confirmed"
  | "lease_expiring"
  | "maintenance_update"
  | "account_created";

interface NotificationSettings {
  email_billing_issued: boolean;
  email_payment_reminder: boolean;
  email_overdue_notice: boolean;
  email_payment_confirmed: boolean;
  email_lease_expiring: boolean;
  sms_payment_reminder: boolean;
  sms_overdue_notice: boolean;
  sms_account_created: boolean;
  sender_email?: string;
  sender_name?: string;
}

interface SendNotificationInput {
  type: NotificationType;
  channels: ("email" | "sms")[];
  recipient_ids: string[];
  template_data?: Record<string, any>;
}
```

---

## 10. 環境変数

```env
# メール（Resend）
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@propertyhub.mn

# SMS（Messagepro.mn例）
SMS_API_URL=https://api.messagepro.mn/v1
SMS_API_KEY=xxxxxxxxxxxx
SMS_SENDER_ID=PropertyHub

# Cron認証
CRON_SECRET=your-secret-key
```

---

## 11. セキュリティ

### 11.1 Cron API 保護

```typescript
// Cron APIの認証
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 処理実行
}
```

### 11.2 レート制限

| 対象                    | 制限           |
| ----------------------- | -------------- |
| 同一ユーザー/同一タイプ | 24 時間に 1 回 |
| 延滞リマインダー        | 7 日に 1 回    |
| 会社全体/時間           | 100 件/時      |

---

**Document Version**: 1.0  
**Previous**: `06-BILLING.md`  
**Next**: `08-ADMIN.md`
