# finance-app

Vue + Viteで作成した家計簿アプリです。

## 機能
- クレジット通知メール貼り付け解析（支出登録）
- Gmail APIブラウザ連携でメール取込
- 手動支出入力 / 手動収入入力
- 月次収支履歴の自動保存（localStorage）
- ダッシュボード（支払い方法内訳、カテゴリ棒グラフ、月次履歴）

## 開発
```bash
npm install
npm run dev
```

## GAS連携
Gmailから三井住友カード・楽天カードの通知をGoogleスプレッドシートへ自動保存するGASは以下にあります。

- `/Users/maekawahiroyuki/finance-site-1/finance-app/gas/InvestmentApi.gs`
- `/Users/maekawahiroyuki/finance-site-1/finance-app/gas/README.md`
