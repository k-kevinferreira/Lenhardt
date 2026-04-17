CREATE TABLE IF NOT EXISTS produtos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  produto VARCHAR(160) NOT NULL,
  quantidade NUMERIC(10, 2) NOT NULL DEFAULT 0,
  data_compra DATE,
  valor_gasto NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'sem_estoque',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ck_produtos_status CHECK (status IN ('ok', 'baixo', 'sem_estoque'))
);

DROP TRIGGER IF EXISTS trg_produtos_updated_at ON produtos;
CREATE TRIGGER trg_produtos_updated_at
BEFORE UPDATE ON produtos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
