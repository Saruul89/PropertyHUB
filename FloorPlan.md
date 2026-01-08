フロアプラン編集機能の改善計画
概要
/dashboard/floor-plans/[propertyId] ページのフロアプランエディタを Excalidraw のような自由配置エディタに改善する。
要件
該当階の全部屋を表示（初期はグリッド配置）
部屋を自由な位置にドラッグ＆ドロップで配置
部屋のサイズを自由にリサイズ可能
ドア、窓、階段、エレベーターのアイコンを 4 方向で配置可能
「保存」ボタンで一括保存
キャンバスは最大 800x600px、収まらない場合は要素をスケールダウンして表示
データベース変更
新規テーブル: floor_elements

CREATE TABLE floor_elements (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
element_type VARCHAR(50) NOT NULL, -- 'door', 'window', 'stairs', 'elevator'
direction VARCHAR(10) NOT NULL, -- 'north', 'south', 'east', 'west'
position_x INTEGER NOT NULL,
position_y INTEGER NOT NULL,
width INTEGER DEFAULT 40,
height INTEGER DEFAULT 40,
created_at TIMESTAMPTZ DEFAULT NOW()
);
マイグレーションファイル
supabase/migrations/00008_floor_elements.sql
修正ファイル一覧

1. 型定義の追加
   ファイル: types/database.ts

export type FloorElementType = 'door' | 'window' | 'stairs' | 'elevator';
export type ElementDirection = 'north' | 'south' | 'east' | 'west';

export interface FloorElement {
id: string;
floor_id: string;
element_type: FloorElementType;
direction: ElementDirection;
position_x: number;
position_y: number;
width: number;
height: number;
created_at: string;
} 2. API ルート作成
ファイル: app/api/floors/[id]/elements/route.ts
GET: フロアのエレメント一覧取得
POST: 新規エレメント作成
PUT: エレメント位置更新
DELETE: エレメント削除
ファイル: app/api/floors/[id]/save/route.ts
POST: フロア全体（units 位置 + elements）の一括保存 3. FloorPlanEditor コンポーネント大幅改修
ファイル: components/features/floor-plan/FloorPlanEditor.tsx
主な変更点:
ローカルステート管理
pendingChanges ステートで変更を追跡
hasUnsavedChanges で保存ボタンの有効/無効を制御
ツールバーの拡張
ドア/窓/階段/エレベーターの配置ボタン追加
方向選択（北/南/東/西）UI を追加
「保存」ボタンを目立つ位置に配置
キャンバス機能強化
部屋（Unit）の自由配置（既存機能を維持）
新しいエレメントのクリック配置
エレメントのドラッグ移動
エレメント選択時の削除・回転機能
一括保存機能
変更があった場合のみ保存ボタンを有効化
保存時に unit の位置と elements を一括で API 送信 4. 新規コンポーネント作成
ファイル: components/features/floor-plan/FloorElementIcon.tsx
ドア/窓/階段/エレベーターの SVG アイコンコンポーネント
4 方向の向きに対応（rotation）
ファイル: components/features/floor-plan/ElementToolbar.tsx
エレメント配置用のツールバーコンポーネント
アイコン選択と方向選択 UI
実装詳細
アイコンデザイン
タイプ 説明
door 扉のアイコン（開く方向を矢印で表示）
window 窓のアイコン（ガラス模様）
stairs 階段のアイコン（段差模様）
elevator エレベーターのアイコン（EV 表示）
保存ロジック

// 一括保存リクエスト
POST /api/floors/[id]/save
{
units: [
{ id, position_x, position_y, width, height }
],
elements: [
{ id?, element_type, direction, position_x, position_y, width, height }
],
deleted_element_ids: string[]
}
UI/UX
ツールバーで配置モードを選択（選択 / 移動 / ドア配置 / 窓配置 / 階段配置 / EV 配置）
方向は配置前にツールバーで選択
キャンバスをクリックするとその位置にエレメントを配置
エレメントは部屋と同様にドラッグで移動可能
部屋選択時にリサイズハンドル表示（角をドラッグでリサイズ）
変更があると「保存」ボタンがアクティブになる（黄色ハイライト等）
保存成功時はトースト通知を表示
キャンバスサイズ・スケーリング
基本キャンバス: 800x600px
要素が収まりきらない場合、自動的にスケールダウン
スケール計算: scale = Math.min(1, 800 / contentWidth, 600 / contentHeight)
transform: scale(${scale}) で全体を縮小表示
部屋の初期配置（グリッド配置）
フロアを開いた時、部屋をグリッド状に自動配列
配置計算: 4 列のグリッド、間隔 150px x 120px
位置未設定の部屋のみグリッド配置を適用
既に保存された位置がある部屋はその位置を維持
部屋リサイズ機能
部屋を選択すると 4 角にリサイズハンドル表示
ハンドルをドラッグでサイズ変更
最小サイズ: 60x50px
グリッドスナップ適用（10px 単位）
実装順序
マイグレーションファイル作成（floor_elements テーブル）
型定義の追加（FloorElement, FloorElementType, ElementDirection）
API ルート作成
/api/floors/[id]/elements - エレメント CRUD
/api/floors/[id]/save - 一括保存
FloorElementIcon コンポーネント作成（4 方向対応 SVG アイコン）
ElementToolbar コンポーネント作成（配置ツール選択 UI）
FloorPlanEditor の改修
ローカルステート管理（pendingChanges, hasUnsavedChanges）
キャンバススケーリング（800x600max）
部屋の初期グリッド配置
部屋のリサイズ機能（4 角ハンドル）
エレメント取得・表示
配置モード切り替え
エレメントのクリック配置
ドラッグ移動機能
一括保存ボタン実装
ファイル変更まとめ
ファイル 変更種別
supabase/migrations/00008_floor_elements.sql 新規作成
types/database.ts 型追加
app/api/floors/[id]/elements/route.ts 新規作成
app/api/floors/[id]/save/route.ts 新規作成
components/features/floor-plan/FloorElementIcon.tsx 新規作成
components/features/floor-plan/ElementToolbar.tsx 新規作成
components/features/floor-plan/FloorPlanEditor.tsx 大幅改修
