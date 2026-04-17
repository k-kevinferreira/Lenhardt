CREATE TABLE IF NOT EXISTS pagamentos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  agendamento_id BIGINT NOT NULL,
  nome_cliente VARCHAR(160) NOT NULL,
  servico VARCHAR(160) NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data_pagamento TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pago',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_pagamentos_agendamento UNIQUE (agendamento_id),
  CONSTRAINT ck_pagamentos_status CHECK (status IN ('pago', 'pendente', 'estornado')),
  CONSTRAINT fk_pagamentos_agendamento
    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pagamentos_data_status ON pagamentos(data_pagamento, status);
