-- investments.type の CHECK制約を拡張
-- 既存: type in ('stock', 'fund')
-- 新規: jp_stock / us_stock / etf も許可

-- 1. 既存の制約を削除
ALTER TABLE public.investments
  DROP CONSTRAINT IF EXISTS investments_type_check;

-- 2. 新しい制約を追加
ALTER TABLE public.investments
  ADD CONSTRAINT investments_type_check
  CHECK (type IN ('stock', 'fund', 'jp_stock', 'us_stock', 'etf'));

-- 3. 既存データのtype='stock'を symbol で自動判定して移行
-- 日本株: 4桁数字
-- ETF: 一般的な米国株ETFシンボル (QQQ, VOO等)
UPDATE public.investments
SET type = CASE
  WHEN symbol ~ '^[0-9]{4}$' THEN 'jp_stock'
  WHEN symbol IN ('QQQ','VOO','SPY','VTI','IVV','EEM','GLD','TLT','VEA','VWO') THEN 'etf'
  ELSE 'us_stock'
END
WHERE type = 'stock';

-- 重要: このSQLはSupabase DashboardのSQL Editorでも手作業で実行する必要があります。
-- CLIでのデプロイが完了したら、現在のデータベース状態を確認してください。
