-- `profiles`
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name    text NOT NULL,
  email        text UNIQUE NOT NULL,   -- john@mail.yourdomain.com
  avatar_url   text,
  role         text DEFAULT 'user',    -- 'user' | 'admin'
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

-- `email_threads`
CREATE TABLE email_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  participants    text[],
  last_message_at timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

-- `emails`
CREATE TABLE emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid REFERENCES email_threads(id) ON DELETE SET NULL,
  owner_id        uuid REFERENCES profiles(id) ON DELETE CASCADE,
  from_address    text NOT NULL,
  to_addresses    text[] NOT NULL,
  cc_addresses    text[] DEFAULT '{}',
  bcc_addresses   text[] DEFAULT '{}',
  reply_to        text,
  subject         text NOT NULL,
  body_html       text,
  body_text       text,
  direction       text NOT NULL,        -- 'inbound' | 'outbound'
  folder          text DEFAULT 'inbox', -- inbox|sent|draft|archive|trash|spam
  is_read         boolean DEFAULT false,
  is_starred      boolean DEFAULT false,
  is_draft        boolean DEFAULT false,
  send_status     text DEFAULT 'pending', -- pending|sent|delivered|bounced|complained
  resend_id       text,                 -- Resend email ID (both inbound + outbound)
  message_id      text,                 -- RFC 5322 Message-ID for threading
  in_reply_to     text,                 -- RFC 5322 In-Reply-To for threading
  created_at      timestamptz DEFAULT now()
);

-- `resend_events` *(idempotency table)*
CREATE TABLE resend_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_event_id text UNIQUE NOT NULL,  -- svix-id header value — deduplication key
  event_type      text NOT NULL,         -- email.received | email.delivered | email.bounced etc.
  processed_at    timestamptz DEFAULT now(),
  payload         jsonb                 -- raw event payload (for audit/debug)
);

-- `attachments`
CREATE TABLE attachments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id        uuid REFERENCES emails(id) ON DELETE CASCADE,
  filename        text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      bigint NOT NULL,
  storage_path    text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- `labels`
CREATE TABLE labels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  color       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- `email_labels`
CREATE TABLE email_labels (
  email_id    uuid REFERENCES emails(id) ON DELETE CASCADE,
  label_id    uuid REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (email_id, label_id)
);

-- Indexes, RLS & Triggers
-- Performance
CREATE INDEX idx_emails_owner_folder ON emails(owner_id, folder, created_at DESC);
CREATE INDEX idx_emails_thread ON emails(thread_id, created_at ASC);
CREATE INDEX idx_emails_message_id ON emails(message_id);
CREATE INDEX idx_emails_resend_id ON emails(resend_id);
CREATE UNIQUE INDEX idx_resend_events_event_id ON resend_events(resend_event_id);

-- RLS on user-facing tables
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_emails" ON emails USING (owner_id = auth.uid());

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_attachments" ON attachments
  USING (email_id IN (SELECT id FROM emails WHERE owner_id = auth.uid()));

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_labels" ON labels USING (owner_id = auth.uid());

-- resend_events: RLS ON — written ONLY by service role key (webhook handler)
-- No anon/authenticated policy needed — this table is never read from the browser
ALTER TABLE resend_events ENABLE ROW LEVEL SECURITY;
-- (intentionally no SELECT/INSERT policy for anon or authenticated roles)

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
