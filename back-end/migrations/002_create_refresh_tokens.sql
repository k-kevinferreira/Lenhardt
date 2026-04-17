CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  revoked SMALLINT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_refresh_tokens_hash UNIQUE (token_hash),
  CONSTRAINT ck_refresh_tokens_revoked CHECK (revoked IN (0, 1)),
  CONSTRAINT fk_refresh_tokens_admin
    FOREIGN KEY (user_id) REFERENCES admins(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
