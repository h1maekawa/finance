# かけいぼ - 家計管理Webアプリ

Vue 3 + TypeScript + Firebase + Tailwind CSS で構築したモバイルファーストの家計簿アプリです。

## 技術スタック

- **フロントエンド**: Vue 3 + TypeScript + Vite + Tailwind CSS
- **認証・DB**: Firebase Authentication + Firestore
- **デプロイ**: Cloudflare Pages

## セットアップ

### 1. 環境変数の設定

```bash
cp .env.example .env
```

`.env` に Firebase プロジェクトの設定値を入力してください。

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 2. Firebase の設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication > Sign-in method で **Google** と **メール/パスワード** を有効化
3. Firestore Database を作成（本番モードで開始）
4. `firestore.rules` のルールをコンソールに貼り付けて公開

### 3. ローカル開発

```bash
npm install
npm run dev
```

### 4. Cloudflare Pages デプロイ

1. Cloudflare Pages でプロジェクト作成
2. GitHub リポジトリを連携
3. ビルド設定:
   - **ビルドコマンド**: `npm run build`
   - **出力ディレクトリ**: `dist`
   - **ルートディレクトリ**: `frontend`
4. 環境変数を Cloudflare Pages の Settings > Environment variables に設定

## ファイル構成

```
frontend/
  public/
    _redirects          # Cloudflare Pages SPA ルーティング
  src/
    components/
      BottomNav.vue     # ボトムナビゲーション（FAB付き）
      TransactionCard.vue
      CategoryGrid.vue
    composables/
      useAuth.ts        # Firebase Auth ラッパー
      useTransactions.ts # Firestore transactions 操作
      useCategories.ts  # Firestore categories 操作
    views/
      LoginView.vue     # ログイン・新規登録
      HomeView.vue      # 月別ダッシュボード
      HistoryView.vue   # 取引履歴
      EntryView.vue     # 取引入力（テンキー付き）
      SettingsView.vue  # カテゴリ管理
    lib/
      firebase.ts       # Firebase 初期化
    router/
      index.ts          # Vue Router（認証ガード付き）
    types/
      index.ts          # TypeScript 型定義
    App.vue
    main.ts
    style.css
```

## Firestoreデータ構造

```
users/{userId}/
  transactions/{transactionId}
    kind: 'income' | 'expense'
    amount: number
    category: string
    date: string (YYYY-MM-DD)
    note: string | null
    createdAt: Timestamp

  categories/{categoryId}
    name: string
    kind: 'income' | 'expense'
    icon: string (Material Symbols名)
    order: number
```

## 機能

- ✅ Google / メール+パスワード認証
- ✅ 認証ガード付きルーティング
- ✅ テンキーで金額入力
- ✅ 月別ダッシュボード（収入・支出・残高カード + 円グラフ）
- ✅ 取引履歴（日付グループ表示・削除）
- ✅ カテゴリ管理（追加・削除）
- ✅ Firestore でユーザーデータ完全分離
- ✅ モバイルファースト（max-width: 480px）
