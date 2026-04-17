CREATE TABLE IF NOT EXISTS agendamentos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(160),
  telefone VARCHAR(30) NOT NULL,
  veiculo_id BIGINT,
  servico VARCHAR(160) NOT NULL,
  data DATE NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_agendamentos_status CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'reagendado', 'concluido')),
  CONSTRAINT fk_agendamentos_veiculo
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_status_data ON agendamentos(status, data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_veiculo ON agendamentos(veiculo_id);

DROP TRIGGER IF EXISTS trg_agendamentos_updated_at ON agendamentos;
CREATE TRIGGER trg_agendamentos_updated_at
BEFORE UPDATE ON agendamentos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
