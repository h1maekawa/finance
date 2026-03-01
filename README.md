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
| `GAS_WEBAPP_URL` | GAS Web App URL | Apps Script デプロイ画面 |
| `GAS_SECRET` | GAS共有シークレット | 自分で作成 |

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

## Vercel デプロイ

### 1. Vercel プロジェクト作成

1. [Vercel](https://vercel.com/) で GitHub リポジトリをインポート
2. **Root Directory** を `frontend` に設定
3. Framework Preset が **Vite** になっていることを確認
4. Build / Output はデフォルトのままで OK

```
Root Directory : frontend
Build Command  : npm run build   (自動検出)
Output Dir     : dist            (自動検出)
```

### 2. 環境変数を Vercel に登録

Vercel の **Settings → Environment Variables** に `.env` と同じキー・値を登録する。

| 変数名 | 値 |
|--------|-----|
| `VITE_SUPABASE_URL` | Supabase の Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase の anon key |
| `VITE_FIREBASE_API_KEY` | Firebase の API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | `finance-site-fada6.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `finance-site-fada6` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `finance-site-fada6.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `858089882597` |
| `VITE_FIREBASE_APP_ID` | Firebase の App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-YME6HPE7CT` |
| `GAS_WEBAPP_URL` | Apps Script の Web App URL |
| `GAS_SECRET` | GAS 側の `APP_SECRET` と同値 |

### 3. Firebase に Vercel ドメインを追加

Firebase Console → Authentication → Settings → **Authorized domains** に以下を追加。

```
your-project.vercel.app       ← Vercel が発行するドメイン
your-custom-domain.com        ← カスタムドメインを使う場合
```

> ※ デプロイ後に Vercel ダッシュボードで発行されたドメインを確認してから追加する。

### 4. SPA ルーティング

`frontend/vercel.json` に全パスを `index.html` へリライトする設定済みなので、
`/transactions` 等を直接開いても 404 にならない。

### 5. Google Sheets 連携（Google Apps Script）

フロントは同一オリジンの `/api/gas/*` を呼び出し、
銘柄追加時に `USER_ENTERED` 相当の数式をシートへ反映する。

- 追加時: `symbol / name / quantity / uid / secret` を GAS へ送信
- GAS 側で `=GOOGLEFINANCE(A{row},"price")` と `=C{row}*D{row}` を設定
- 取得時: `uid + secret` で自分の行のみ返却

---

## 今後の拡張

- household 招待フロー（メール招待テーブル追加）
- budgets UI 実装
- materialized view による月次集計高速化
- 課金テーブル追加（plans / subscriptions / invoices）
