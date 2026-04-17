CREATE TABLE IF NOT EXISTS veiculos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  placa VARCHAR(12) NOT NULL,
  nome_cliente VARCHAR(160) NOT NULL,
  veiculo VARCHAR(160) NOT NULL,
  ultimo_servico VARCHAR(160),
  data_ultimo_servico DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_veiculos_placa UNIQUE (placa)
);

DROP TRIGGER IF EXISTS trg_veiculos_updated_at ON veiculos;
CREATE TRIGGER trg_veiculos_updated_at
BEFORE UPDATE ON veiculos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
