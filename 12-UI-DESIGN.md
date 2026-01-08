# 12 - UI デザインリファクタリング

## Claude Code Implementation Guide - UI Design Refresh

> **重要**: このドキュメントは**デザインのみ**の変更です。
> 機能追加・削除は一切行わないでください。
> 既存のボタン、機能、データフローは全て維持してください。

---

## ⚠️ Claude Code への最重要指示

```
┌─────────────────────────────────────────────────────────────┐
│  このリファクタリングで変更するもの:                        │
│  ✅ 色、形、角丸、影、グラデーション                        │
│  ✅ レイアウトの配置、間隔、サイズ比率                      │
│  ✅ サイドバーのスタイル（ダーク/ライト）                   │
│  ✅ カードのスタイル、ホバーエフェクト                      │
│  ✅ フォントサイズ、太さのバランス                          │
│                                                             │
│  このリファクタリングで変更しないもの:                      │
│  ❌ 機能の追加・削除                                        │
│  ❌ ボタンの追加・削除                                      │
│  ❌ ページの追加・削除                                      │
│  ❌ データの流れ、API呼び出し                               │
│  ❌ ビジネスロジック                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. デザインコンセプト

### 1.1 参考デザインの特徴

| 要素 | 特徴 |
|------|------|
| **サイドバー** | ダークカラー（黒/濃紺）、波線の装飾 |
| **背景** | 暖かいグラデーション（ピンク→オレンジ→パープル） |
| **カード** | 白背景、大きな角丸（20-24px）、ソフトシャドウ |
| **統計カード** | 丸いアイコン、対照的な背景色（白/黒） |
| **アクセントカラー** | パープル/バイオレット系のグラデーション |
| **タグ/バッジ** | pill型（完全な角丸）、パステルカラー |

### 1.2 全体イメージ

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                        │
│ │          │  ┌─────────────────────────────────────────────────┐  │
│ │  DARK    │  │                                                 │  │
│ │  SIDEBAR │  │      GRADIENT BACKGROUND                        │  │
│ │          │  │      (warm pink → orange → purple)              │  │
│ │  ・Logo  │  │                                                 │  │
│ │  ・Nav   │  │   ┌─────────┐  ┌─────────┐  ┌─────────┐        │  │
│ │  ・Items │  │   │ WHITE   │  │ DARK    │  │ WHITE   │        │  │
│ │          │  │   │ CARD    │  │ CARD    │  │ CARD    │        │  │
│ │  波線    │  │   │ rounded │  │ rounded │  │ rounded │        │  │
│ │  装飾    │  │   └─────────┘  └─────────┘  └─────────┘        │  │
│ │          │  │                                                 │  │
│ └──────────┘  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. カラーパレット

### 2.1 新しいカラー定義

```css
:root {
  /* サイドバー - ダークテーマ */
  --sidebar-bg: #1a1a2e;           /* 濃紺/ほぼ黒 */
  --sidebar-text: #ffffff;
  --sidebar-text-muted: #a0a0b0;
  --sidebar-active-bg: #8b5cf6;    /* パープル */
  --sidebar-hover-bg: rgba(139, 92, 246, 0.1);
  
  /* 背景グラデーション */
  --bg-gradient-start: #fce7f3;    /* ピンク */
  --bg-gradient-middle: #fed7aa;   /* オレンジ */
  --bg-gradient-end: #e9d5ff;      /* パープル */
  
  /* アクセントカラー */
  --accent-primary: #8b5cf6;       /* パープル */
  --accent-secondary: #a855f7;     /* ライトパープル */
  --accent-gradient: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  
  /* カード */
  --card-bg: #ffffff;
  --card-bg-dark: #1a1a2e;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  --card-radius: 20px;
  
  /* ステータス色（既存を維持） */
  --status-vacant: #3b82f6;
  --status-occupied: #22c55e;
  --status-maintenance: #eab308;
  --status-reserved: #a855f7;
}
```

### 2.2 Tailwind カスタムクラス

```javascript
// tailwind.config.js に追加
module.exports = {
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: '#1a1a2e',
          light: '#2d2d44',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a855f7',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.08)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
    },
  },
}
```

---

## 3. サイドバー

### 3.1 Before → After

```
Before (現在):                    After (新デザイン):
┌──────────────────┐              ┌──────────────────┐
│ ░░░░░░░░░░░░░░░░ │              │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← ダーク背景
│ PropertyHub      │              │ 🏢 PropertyHub   │ ← 白文字
│                  │              │                  │
│ □ Dashboard      │              │ ● Dashboard      │ ← アクティブ: パープル背景
│ □ Properties     │              │ ○ Properties     │ ← 非アクティブ: 白文字
│ □ Tenants        │              │ ○ Tenants        │
│ □ Billings       │              │ ○ Billings       │
│                  │              │                  │
│                  │              │    〰️〰️〰️        │ ← 波線装飾（オプション）
│                  │              │                  │
│ [Logout]         │              │ [👤] [⚙️] [🔴]   │ ← アイコンボタン
└──────────────────┘              └──────────────────┘
```

### 3.2 サイドバーCSS

```tsx
// components/layout/sidebar.tsx

<aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar">
  {/* 波線装飾（背景） */}
  <div className="absolute bottom-0 left-0 right-0 h-48 opacity-10">
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <path 
        d="M0,100 Q50,50 100,100 T200,100" 
        fill="none" 
        stroke="white" 
        strokeWidth="1"
      />
      <path 
        d="M0,120 Q50,70 100,120 T200,120" 
        fill="none" 
        stroke="white" 
        strokeWidth="1"
      />
    </svg>
  </div>

  {/* コンテンツ */}
  <div className="relative flex h-full flex-col">
    {/* ロゴ */}
    <div className="flex h-16 items-center px-6">
      <Building2 className="h-6 w-6 text-accent" />
      <span className="ml-2 text-xl font-bold text-white">PropertyHub</span>
    </div>

    {/* ナビゲーション */}
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
            isActive
              ? "bg-accent text-white shadow-lg"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          )}
        >
          <Icon className="h-5 w-5" />
          {item.label}
          {item.badge && (
            <span className="ml-auto rounded-full bg-cyan-400 px-2 py-0.5 text-xs text-black">
              {item.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>

    {/* フッター */}
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <User className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={signOut} className="text-red-400 hover:text-red-300">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  </div>
</aside>
```

---

## 4. メインコンテンツエリア

### 4.1 背景グラデーション

```tsx
// app/(dashboard)/layout.tsx

<main 
  className="ml-64 min-h-screen"
  style={{
    background: 'linear-gradient(135deg, #fce7f3 0%, #fed7aa 50%, #e9d5ff 100%)',
  }}
>
  {children}
</main>
```

### 4.2 代替案（よりソフトなグラデーション）

```tsx
// 控えめなグラデーション
<main 
  className="ml-64 min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50"
>
  {children}
</main>
```

---

## 5. カードスタイル

### 5.1 基本カード

```tsx
// 新しいカードスタイル
<Card className="rounded-2xl border-0 bg-white shadow-soft">
  <CardContent className="p-6">
    {/* コンテンツ */}
  </CardContent>
</Card>
```

### 5.2 統計カード（ダッシュボード）

```tsx
// 白背景の統計カード
<Card className="rounded-2xl border-0 bg-white shadow-soft overflow-hidden">
  <CardContent className="p-6">
    <div className="flex items-center gap-4">
      {/* 丸いアイコン */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light">
        <Building2 className="h-7 w-7 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">Үл хөдлөх хөрөнгө</p>
        <p className="text-2xl font-bold">{stats.property_count}</p>
      </div>
    </div>
  </CardContent>
</Card>

// ダーク背景の統計カード（アクセント用）
<Card className="rounded-2xl border-0 bg-sidebar text-white shadow-card overflow-hidden">
  <CardContent className="p-6">
    <div className="flex items-center gap-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
        <TrendingUp className="h-7 w-7 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-300">Эзэмшлийн хувь</p>
        <p className="text-2xl font-bold">{occupancyRate}%</p>
      </div>
    </div>
  </CardContent>
</Card>
```

### 5.3 統計カードのグリッド配置

```tsx
// ダッシュボードの統計カード配置
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 白カード */}
  <StatCard 
    icon={Building2} 
    label="Үл хөдлөх хөрөнгө" 
    value={stats.property_count}
    variant="light"
  />
  
  {/* ダークカード */}
  <StatCard 
    icon={TrendingUp} 
    label="Эзэмшлийн хувь" 
    value={`${occupancyRate}%`}
    variant="dark"
  />
  
  {/* 白カード */}
  <StatCard 
    icon={Users} 
    label="Түрээслэгчид" 
    value={stats.tenant_count}
    variant="light"
  />
  
  {/* アクセントカード */}
  <StatCard 
    icon={Receipt} 
    label="Энэ сарын нэхэмжлэл" 
    value={formatCurrency(stats.current_month_billing)}
    variant="accent"
  />
</div>
```

---

## 6. ボタンスタイル

### 6.1 プライマリボタン

```tsx
// パープルグラデーションボタン
<Button 
  className="rounded-xl bg-gradient-to-r from-accent to-accent-light text-white shadow-lg hover:shadow-xl transition-all"
>
  <Plus className="mr-2 h-4 w-4" />
  Нэмэх
</Button>
```

### 6.2 アウトラインボタン

```tsx
// 角丸のアウトラインボタン
<Button 
  variant="outline"
  className="rounded-xl border-2 hover:bg-gray-50"
>
  засах
</Button>
```

### 6.3 アイコンボタン

```tsx
// 丸いアイコンボタン
<Button 
  variant="ghost" 
  size="icon"
  className="rounded-full hover:bg-accent/10"
>
  <Settings className="h-5 w-5" />
</Button>
```

---

## 7. フォームコンポーネント

### 7.1 入力フィールド

```tsx
// 角丸の入力フィールド
<Input 
  className="rounded-xl border-gray-200 focus:border-accent focus:ring-accent"
  placeholder="Хайх..."
/>
```

### 7.2 セレクト

```tsx
// 角丸のセレクト
<Select>
  <SelectTrigger className="rounded-xl border-gray-200">
    <SelectValue placeholder="Сонгох" />
  </SelectTrigger>
  <SelectContent className="rounded-xl">
    {/* オプション */}
  </SelectContent>
</Select>
```

---

## 8. タグ/バッジ

### 8.1 ステータスバッジ

```tsx
// pill型のステータスバッジ
const statusStyles = {
  vacant: "bg-blue-100 text-blue-700",
  occupied: "bg-green-100 text-green-700", 
  maintenance: "bg-yellow-100 text-yellow-700",
  reserved: "bg-purple-100 text-purple-700",
};

<span className={cn(
  "rounded-full px-3 py-1 text-xs font-medium",
  statusStyles[status]
)}>
  {statusLabel}
</span>
```

### 8.2 フィルタータグ

```tsx
// 選択可能なタグ
<div className="flex flex-wrap gap-2">
  <button className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 transition-colors">
    Remote ✕
  </button>
  <button className="rounded-full bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 transition-colors">
    Italian ✕
  </button>
</div>
```

---

## 9. リストアイテム

### 9.1 取引履歴風リスト

```tsx
// 取引リスト（Recent Transactions風）
<div className="space-y-3">
  {items.map((item) => (
    <div 
      key={item.id}
      className="flex items-center gap-4 rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
    >
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        item.type === 'income' ? "bg-green-100" : "bg-red-100"
      )}>
        <item.icon className={cn(
          "h-5 w-5",
          item.type === 'income' ? "text-green-600" : "text-red-600"
        )} />
      </div>
      <div className="flex-1">
        <p className="font-medium">{item.title}</p>
        <p className="text-sm text-gray-500">{item.description}</p>
      </div>
      <p className={cn(
        "font-semibold",
        item.type === 'income' ? "text-green-600" : "text-red-600"
      )}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </p>
    </div>
  ))}
</div>
```

---

## 10. テーブル

### 10.1 角丸テーブル

```tsx
// 角丸のテーブルコンテナ
<div className="rounded-2xl bg-white shadow-soft overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="bg-gray-50">
        <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">
          Нэр
        </th>
        {/* ... */}
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-100">
      {/* 行 */}
    </tbody>
  </table>
</div>
```

---

## 11. ページヘッダー

### 11.1 新しいヘッダースタイル

```tsx
// シンプルなページヘッダー
<div className="mb-8">
  <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
  <p className="text-gray-500">Системийн тойм</p>
</div>
```

### 11.2 右上のユーザー情報（オプション）

```tsx
// ヘッダー右側
<div className="flex items-center gap-4">
  <div className="rounded-2xl bg-gradient-to-r from-accent to-accent-light px-4 py-2 text-white">
    <span className="text-sm">My Balance</span>
    <span className="ml-2 font-bold">₮9,250,000</span>
  </div>
</div>
```

---

## 12. 適用の優先順位

### Phase 1: 基本スタイル（必須）
1. サイドバーをダークテーマに変更
2. メインエリアの背景グラデーション
3. カードの角丸を大きく（20px）
4. ボタンの角丸を大きく

### Phase 2: カード改善
1. 統計カードのデザイン更新
2. シャドウをソフトに
3. ホバーエフェクト追加

### Phase 3: 細部調整
1. バッジ/タグのpill化
2. 入力フィールドの角丸
3. テーブルの角丸化

---

## 13. 変更が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `tailwind.config.js` | カスタムカラー、borderRadius追加 |
| `app/globals.css` | CSS変数の追加 |
| `components/layout/sidebar.tsx` | ダークテーマ化 |
| `app/(dashboard)/layout.tsx` | 背景グラデーション |
| `components/ui/card.tsx` | デフォルト角丸変更 |
| `components/ui/button.tsx` | デフォルト角丸変更 |
| `app/(dashboard)/dashboard/page.tsx` | 統計カードスタイル |

---

## 14. 重要な注意事項

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 絶対に変更しないこと                                    │
│                                                             │
│  • ページのルーティング構造                                 │
│  • APIエンドポイント                                        │
│  • データベースクエリ                                       │
│  • 認証フロー                                               │
│  • ボタンのonClickハンドラ                                  │
│  • フォームのsubmit処理                                     │
│  • 機能の追加・削除                                         │
│                                                             │
│  ✅ 変更して良いこと                                        │
│                                                             │
│  • className の値                                           │
│  • style 属性                                               │
│  • アイコンのサイズ                                         │
│  • 色、影、角丸                                             │
│  • 要素の並び順（レイアウト）                               │
│  • アニメーション、トランジション                           │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Type**: Visual Design Only  
**Dependencies**: None - Pure CSS/Tailwind changes
