ALTER TABLE admins
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'admin';

UPDATE admins
SET role = 'admin'
WHERE role IS NULL OR BTRIM(role) = '';

ALTER TABLE admins
  DROP CONSTRAINT IF EXISTS ck_admins_role;

ALTER TABLE admins
  ADD CONSTRAINT ck_admins_role CHECK (role IN ('admin', 'operador'));
