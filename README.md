# Finance App (Vue 3 + Supabase)

家計簿アプリの初期実装です。個人利用から始めて、`household_id` ベースで SaaS 化できる構造にしています。

## 構成
- `supabase/migrations/20260215230000_init_household_budget_app.sql`
  - households / profiles / household_members / categories / transactions / budgets
  - FK / index / trigger / RLS policy
- `frontend/`
  - Vue 3 + Composition API + Supabase client
  - Auth
  - カテゴリ CRUD
  - 取引 CRUD
  - 月別フィルター
  - リアクティブ月次収支
  - 円グラフ・棒グラフ

## セットアップ

### 1. Supabase
1. Supabase プロジェクトを作成
2. SQL Editor で `supabase/migrations/20260215230000_init_household_budget_app.sql` を実行
3. Auth の Email/Password を有効化

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# .env の URL / ANON KEY を設定
npm install
npm run dev
```

## セキュリティ要点
- すべての業務テーブルで RLS 有効
- household membership に基づくアクセス制御
- クライアントは anon key のみ使用
- service role key はサーバー専用

## 今後の拡張
- household 招待フロー（メール招待テーブル追加）
- budgets UI 実装
- materialized view による月次集計高速化
- 課金テーブル追加（plans/subscriptions/invoices）
