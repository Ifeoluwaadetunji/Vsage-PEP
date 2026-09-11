CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type         text NOT NULL,
  -- 'email.received'  — new inbound email
  -- 'email.bounced'   — outbound email bounced
  -- 'email.delivered' — outbound delivered
  -- 'admin.invite'    — new user invited (admin only)
  -- 'system'          — general system message
  title        text NOT NULL,
  body         text,
  resource_id  uuid,             -- email_id or user_id the notif relates to
  href         text,             -- where to navigate on click
  is_read      boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_notif_owner ON notifications(owner_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_notifications" ON notifications
  USING (owner_id = auth.uid());
