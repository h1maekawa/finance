-- Gmail自動取込ログテーブル
CREATE TABLE IF NOT EXISTS public.email_import_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id text NOT NULL,
    gmail_message_id text NOT NULL,
    -- GmailメッセージID（重複防止）
    card_type text NOT NULL,
    -- 'smbc' | 'rakuten'
    transaction_date date NOT NULL,
    store_name text NOT NULL,
    amount bigint NOT NULL,
    category_id uuid REFERENCES public.categories(id) ON DELETE
    SET NULL,
        credit_card_id uuid REFERENCES public.credit_cards(id) ON DELETE
    SET NULL,
        transaction_id uuid REFERENCES public.transactions(id) ON DELETE
    SET NULL,
        status text NOT NULL DEFAULT 'imported',
        -- 'imported' | 'skipped' | 'error'
        raw_subject text,
        raw_body text,
        imported_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (gmail_message_id) -- 同じメールの二重取込防止
);
CREATE INDEX IF NOT EXISTS idx_email_import_logs_household ON public.email_import_logs (household_id, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_import_logs_message_id ON public.email_import_logs (gmail_message_id);
-- RLS設定
ALTER TABLE public.email_import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY email_import_logs_select ON public.email_import_logs FOR
SELECT USING (public.is_household_member(household_id));
CREATE POLICY email_import_logs_insert ON public.email_import_logs FOR
INSERT WITH CHECK (public.is_household_member(household_id));