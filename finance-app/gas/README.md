# Gmail -> Google Sheets 自動取込（GAS）

## 1. 事前準備
1. Googleスプレッドシートを作成
2. URLの`/d/`と`/edit`の間をコピー（これがSpreadsheet ID）
3. Apps Scriptプロジェクトを作成し、`InvestmentApi.gs`の内容を貼り付け
4. `SPREADSHEET_ID`を置き換え

## 2. 抽出対象メール
- 三井住友カード
  - ラベル: `三井住友クレジット`
  - `from:statement@vpass.ne.jp`
  - 未読のみ（`is:unread`）
- 楽天カード
  - ラベル: `楽天カード`
  - `from:info@mail.rakuten-card.co.jp`
  - 未読のみ（`is:unread`）

処理後のメールは既読化します。

## 3. 保存先シート
- `個別投資_三井住友`
- `個別投資_楽天`
- `個別投資_現金`
- `個別投資_PayPay`
- `_processed_ids_cards`（重複防止ログ、非表示）

`InvestmentApi.gs`の`CARD_SHEET_CONFIGS`と`EXPENSE_SHEET_NAMES`を編集すると、ラベル名・送信元・反映先タブ名を変更できます。

## 4. 実行手順
1. `importCardNoticesToInvestmentSpreadsheet`を手動実行して認可
2. `createCardImportTrigger_`を手動実行して15分トリガー作成

## 5. 重複防止
- Gmailの`messageId`と`uid`で重複キーを作成して`_processed_ids_cards`に保存
- 既処理キーは再取り込みしない
