const test = require("node:test");
const assert = require("node:assert/strict");

const { splitCsv, validateAppEnv } = require("../src/config/env");

const baseEnv = {
  DATABASE_URL: "postgresql://postgres:senha@localhost:5432/lenhardt_db",
  ACCESS_TOKEN_SECRET: "access_secret_com_tamanho_suficiente_123",
  REFRESH_TOKEN_SECRET: "refresh_secret_com_tamanho_suficiente_123",
};

test("splitCsv normaliza lista separada por virgula", () => {
  assert.deepEqual(splitCsv(" http://localhost:5500, ,https://app.exemplo.com "), [
    "http://localhost:5500",
    "https://app.exemplo.com",
  ]);
});

test("validateAppEnv aceita desenvolvimento sem CORS_ORIGINS", () => {
  const config = validateAppEnv({
    ...baseEnv,
    NODE_ENV: "development",
  });

  assert.equal(config.isProd, false);
  assert.deepEqual(config.allowedOrigins, []);
});

test("validateAppEnv exige CORS_ORIGINS em producao", () => {
  assert.throws(
    () =>
      validateAppEnv({
        ...baseEnv,
        NODE_ENV: "production",
      }),
    /CORS_ORIGINS/
  );
});

test("validateAppEnv rejeita secrets fracos em producao", () => {
  assert.throws(
    () =>
      validateAppEnv({
        ...baseEnv,
        NODE_ENV: "production",
        CORS_ORIGINS: "https://app.exemplo.com",
        ACCESS_TOKEN_SECRET: "defina_um_segredo_forte_para_access",
      }),
    /ACCESS_TOKEN_SECRET/
  );
});
