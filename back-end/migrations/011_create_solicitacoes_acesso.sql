CREATE TABLE IF NOT EXISTS solicitacoes_acesso (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  telefone VARCHAR(30),
  senha_hash VARCHAR(255) NOT NULL,
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  reviewed_at TIMESTAMPTZ,
  reviewed_by_admin_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_solicitacoes_acesso_status CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  CONSTRAINT fk_solicitacoes_acesso_reviewed_by
    FOREIGN KEY (reviewed_by_admin_id) REFERENCES admins(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_solicitacoes_acesso_status ON solicitacoes_acesso(status);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_acesso_email ON solicitacoes_acesso(email);

DROP TRIGGER IF EXISTS trg_solicitacoes_acesso_updated_at ON solicitacoes_acesso;
CREATE TRIGGER trg_solicitacoes_acesso_updated_at
BEFORE UPDATE ON solicitacoes_acesso
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
