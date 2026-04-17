CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_admin_id BIGINT,
  actor_email VARCHAR(160),
  action VARCHAR(80) NOT NULL,
  target_type VARCHAR(80),
  target_id BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  ip VARCHAR(64),
  user_agent TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_actor_admin
    FOREIGN KEY (actor_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL,
  CONSTRAINT ck_audit_logs_status CHECK (status IN ('success', 'failure'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_admin_id ON audit_logs(actor_admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
