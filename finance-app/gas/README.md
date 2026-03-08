# Gmail -> Google Sheets 自動取込（GAS）

## 1. 事前準備
1. Googleスプレッドシートを作成
2. URLの`/d/`と`/edit`の間をコピー（これがSpreadsheet ID）
3. Apps Scriptプロジェクトを作成し、`Code.gs`の内容を貼り付け
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
- `収入`（手動入力用）
- `月次収支`（自動集計）
- `_processed_ids`（重複防止ログ、非表示）

`Code.gs`の`SHEET_CONFIGS`を編集すると、ラベル名・送信元・反映先タブ名を変更できます。

## 4. 実行手順
1. `importCardNotices`を手動実行して認可
2. `createTriggers`を手動実行して15分トリガー作成

## 5. 重複防止
- Gmail Message IDを`_processed_ids`に保存
- 既処理IDは再取り込みしない

## 6. 月次収支の保存
- `三井住友`と`楽天`シートの金額を支出として月単位集計
- `収入`シートの金額を収入として月単位集計
- 結果を`月次収支`シートに保存（上書き再計算）
