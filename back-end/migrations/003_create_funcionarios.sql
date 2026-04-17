CREATE TABLE IF NOT EXISTS funcionarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  cargo VARCHAR(80) NOT NULL,
  email VARCHAR(160),
  telefone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'ativo',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_funcionarios_status CHECK (status IN ('ativo', 'inativo'))
);

DROP TRIGGER IF EXISTS trg_funcionarios_updated_at ON funcionarios;
CREATE TRIGGER trg_funcionarios_updated_at
BEFORE UPDATE ON funcionarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
