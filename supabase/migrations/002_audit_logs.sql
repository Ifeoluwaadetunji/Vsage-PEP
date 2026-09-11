CREATE TABLE audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action       text NOT NULL,   -- 'login.success' | 'login.failure' | 'email.sent'
                                -- 'email.deleted' | 'attachment.downloaded'
                                -- 'admin.user_created' | 'api.rate_limited'
  resource     text,            -- e.g. email ID, user ID
  ip_address   text,
  user_agent   text,
  metadata     jsonb,           -- extra context
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);

-- Retain 90 days — auto-purge via pg_cron or a nightly Supabase Edge Function
-- RLS: only admins can SELECT; webhook/server writes via service role
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_audit" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
