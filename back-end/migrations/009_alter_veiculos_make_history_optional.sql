ALTER TABLE veiculos
  ALTER COLUMN ultimo_servico DROP NOT NULL,
  ALTER COLUMN data_ultimo_servico DROP NOT NULL,
  ALTER COLUMN observacao DROP NOT NULL;
