-- Create gmail_tokens table to store Google OAuth access/refresh tokens
CREATE TABLE IF NOT EXISTS public.gmail_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_type text NOT NULL DEFAULT 'google',
  scopes text NOT NULL DEFAULT 'gmail.readonly',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
-- SELECT/UPDATE/DELETE/INSERT only if user_id matches Firebase JWT sub
DROP POLICY IF EXISTS "gmail_tokens_all_own" ON public.gmail_tokens;
CREATE POLICY "gmail_tokens_all_own" ON public.gmail_tokens
  FOR ALL
  USING (user_id = (auth.jwt()->>'sub'))
  WITH CHECK (user_id = (auth.jwt()->>'sub'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_gmail_tokens_timestamps ON public.gmail_tokens;
CREATE TRIGGER trg_gmail_tokens_timestamps BEFORE
INSERT
  OR
UPDATE ON public.gmail_tokens FOR EACH ROW EXECUTE FUNCTION public.set_timestamps();
