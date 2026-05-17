# Finance App (Vue 3 + Firebase Auth/Firestore + GAS)

自動連携機能付きの、モバイルファーストなシンプル家計簿Webアプリケーション。
三井住友カード・楽天カード・PayPayの決済通知メールから自動で家計簿データを抽出し、リアルタイムにFirestoreに反映します。

## 🌟 特徴

- **自動連携 (Gmail ➔ GAS ➔ Firestore)**: カード会社の決済通知メールを定期スキャンし、AI・ルールベースによる店舗名からのカテゴリ自動分類と二重取込防止（冪等性）を行いながらFirestoreに自動保存します。
- **リアルタイム反映 (onSnapshot)**: Firebase Firestoreのリスナー機能を使用し、自動インポートされたデータが画面上に一切のリロードなしで即座に反映されます。
- **モバイルファースト設計**: 最大幅480pxに最適化されたプレミアムで滑らかなアニメーションを伴うモダンUI（ダークモードLP完備）。
- **ユーザーデータ完全分離**: Firebase Authに紐づく `users/{userId}/transactions` サブコレクション構成により、マルチテナントでの完全なデータ分離を実現。

---

## 📁 フォルダ構成

```
finance/
├── firestore.rules          # Firestoreのセキュリティルール（ユーザー分離）
└── frontend/
    ├── src/
    │   ├── components/      # BottomNav.vue / CategoryGrid.vue / TransactionCard.vue
    │   ├── composables/     # useAuth / useTransactions (リアルタイム監視対応)
    │   ├── lib/             # firebase.ts (Firebase SDK初期化)
    │   ├── router/          # ルーティング（LP、ログイン、ホーム、履歴、入力、設定）
    │   ├── types/           # index.ts (TransactionやCategory等の型定義)
    │   ├── views/           # 各ページ（LandingView, HomeView, EntryView, HistoryView, SettingsView, LoginView）
    │   └── style.css        # Tailwind CSS + 独自カスタムテーマ
    ├── .env.example         # フロントエンド環境変数テンプレート
    └── index.html           # アプリのエントリーHTML
```

---

## 🛠️ セットアップとデプロイ手順

### 1. Firebase（認証・DB・セキュリティルール）

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成します。
2. **Authentication** で「Google ログイン」および「メール/パスワード認証」を有効化します。
3. **Firestore Database** を作成します。
4. **セキュリティルール** (`firestore.rules`) にリポジトリ直下のルールファイルを適用します。
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. プロジェクト設定からウェブアプリを追加し、Firebase SDK設定情報を取得します。

---

### 2. Frontend のローカル実行

1. **環境変数の準備**
   `frontend` フォルダに移動し、`.env` ファイルを作成してFirebaseの接続情報を記入します。
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **依存関係のインストールと起動**
   ```bash
   npm install
   npm run dev
   ```

3. **ビルド (デプロイ確認用)**
   ```bash
   npm run build
   ```

#### フロント環境変数一覧 (`frontend/.env`)
| 変数名 | 説明 |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase API キー |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase 認証ドメイン |
| `VITE_FIREBASE_PROJECT_ID` | Firebase プロジェクト ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage バケット |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging 送信者 ID |
| `VITE_FIREBASE_APP_ID` | Firebase アプリ ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics ID (任意) |

---

### 3. Google Apps Script (GAS) 自動連携の設定

Gmailのカード決済通知を検知し、Firestore REST APIへ送信するバックグラウンドバッチの設定手順です。詳細は `brain/` 内の設計書 [gmail_gas_firestore_integration.md](file:///Users/maekawahiroyuki/.gemini/antigravity/brain/b8eb9666-1665-4c65-9eab-bbc54c7fab2d/gmail_gas_firestore_integration.md) を参照してください。

1. **サービスアカウントの生成**: Firebase Console > プロジェクト設定 > サービス アカウント より秘密鍵（JSON）を生成しダウンロードします。
2. **GASの作成**: [Google Apps Script](https://script.google.com/) で新規プロジェクトを作成し、`GmailImporter.gs` に設計書記載のコードを貼り付けます。
3. **スクリプトプロパティの登録**:
   - `FIREBASE_PROJECT_ID`: ダウンロードしたJSONの `project_id`
   - `CLIENT_EMAIL`: JSONの `client_email`
   - `PRIVATE_KEY`: JSONの `private_key` （`\n`も含めてすべて）
   - `TARGET_UID`: 登録対象となるあなた自身のFirebaseログインユーザーUID
4. **トリガー設定**: `processCardEmails` 関数を **「時間主導型」>「分ベースのタイマー」>「5分ごと」** でトリガー実行するように設定します。

---

## 🚀 Cloudflare Pages / Vercel デプロイ

Vite製のSPAですので、静的ホスティング（Cloudflare Pages や Vercel）に一瞬でデプロイできます。

### 1. デプロイ設定
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 2. 環境変数の追加
Firebase Consoleから取得した `VITE_FIREBASE_` で始まる各接続キーをデプロイ環境の「Environment Variables（環境変数）」に登録します。

### 3. SPAのルーティング対応
Cloudflare Pages用に `frontend/public/_redirects` に以下の設定が組み込まれています。これにより、どのURLに直接アクセスしても正しくSPAルーティングが行われ、404エラーを回避できます。
```text
/*    /index.html   200
```
*(Vercelにデプロイする場合は、`vercel.json` などのリライト設定を必要に応じてご活用ください)*
