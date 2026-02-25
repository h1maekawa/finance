# Finance App（Vue 3 + Firebase + Supabase）

家計簿アプリ。Firebase で認証（Google ログイン）、Supabase でデータ管理。

## フォルダ構成

```
finance/
├── backend/
│   └── supabase/
│       └── schema.sql       # DB スキーマ（テーブル / RLS / 関数 すべて）
└── frontend/
    ├── src/
    │   ├── composables/     # useAuth / useHousehold / useTransactions など
    │   ├── components/      # AppHeader / BottomNavigation / グラフ
    │   ├── views/           # 各画面
    │   ├── lib/             # firebase.ts / supabase.ts
    │   ├── stores/          # session.ts（ユーザー状態）
    │   ├── services/        # categoryService.ts
    │   └── types/           # db.ts（型定義）
    ├── .env                 # 環境変数（Git 管理外）
    └── .env.example         # 環境変数テンプレート
```

## セットアップ

### 1. Firebase（認証）

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクト作成
2. **Authentication → Sign-in method** で「Google」を有効化
3. プロジェクト設定 → ウェブアプリを追加して設定値を取得

### 2. Supabase（データ）

1. [Supabase](https://supabase.com/) でプロジェクト作成
2. **SQL Editor** で `backend/supabase/schema.sql` をそのまま実行
3. **Authentication → Third-party auth** で Firebase を追加（Project ID を入力）
   - 参照: [Firebase Auth 連携](https://supabase.com/docs/guides/auth/third-party/firebase-auth)

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# .env に VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY を記入
npm install
npm run dev
```

### 環境変数一覧

| 変数名 | 説明 | 取得元 |
|--------|------|--------|
| `VITE_SUPABASE_URL` | Supabase プロジェクト URL | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase → Settings → API |
| `VITE_FIREBASE_API_KEY` | Firebase API キー | Firebase Console → プロジェクト設定 |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase 認証ドメイン | 同上 |
| `VITE_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID | 同上 |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット | 同上 |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Sender ID | 同上 |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | 同上 |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID | 同上（任意） |

## DB 設計概要

| テーブル | 説明 |
|----------|------|
| `households` | 家計グループ（owner_user_id = Firebase UID） |
| `profiles` | ユーザープロフィール（id = Firebase UID） |
| `household_members` | 家計メンバー（user_id = Firebase UID） |
| `categories` | 収支カテゴリ（household 単位） |
| `transactions` | 収支明細 |
| `budgets` | 月次予算 |
| `household_settings` | 目標金額・目標年 |
| `household_assets` | 資産内訳（株 / 投信 / 現金 / 口座） |

- すべてのテーブルで RLS 有効
- `auth.jwt()->>'sub'` で Firebase UID を参照
- 新規ユーザーは `bootstrap_new_user()` RPC で household を自動生成

## セキュリティ要点

- クライアントは anon key のみ使用（service role key はサーバー専用）
- household membership に基づくアクセス制御
- Firebase ID トークンを Supabase リクエストヘッダーに付与

## 今後の拡張

- household 招待フロー（メール招待テーブル追加）
- budgets UI 実装
- materialized view による月次集計高速化
- 課金テーブル追加（plans / subscriptions / invoices）
