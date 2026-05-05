function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasDatabaseConfig(env) {
  if (env.DATABASE_URL) return true;
  return Boolean(env.DB_HOST && env.DB_USER && env.DB_NAME);
}

function isWeakProductionSecret(value) {
  const secret = String(value || "").trim();
  if (secret.length < 32) return true;
  return /^defina_/i.test(secret) || /segredo/i.test(secret);
}

function validateAppEnv(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const missing = [];
  const invalid = [];

  if (!hasDatabaseConfig(env)) {
    missing.push("DATABASE_URL ou DB_HOST/DB_USER/DB_NAME");
  }

  if (!env.ACCESS_TOKEN_SECRET) missing.push("ACCESS_TOKEN_SECRET");
  if (!env.REFRESH_TOKEN_SECRET) missing.push("REFRESH_TOKEN_SECRET");

  const allowedOrigins = splitCsv(env.CORS_ORIGINS);
  if (isProd && allowedOrigins.length === 0) {
    missing.push("CORS_ORIGINS");
  }

  if (isProd && env.ACCESS_TOKEN_SECRET && isWeakProductionSecret(env.ACCESS_TOKEN_SECRET)) {
    invalid.push("ACCESS_TOKEN_SECRET deve ser forte em producao");
  }

  if (isProd && env.REFRESH_TOKEN_SECRET && isWeakProductionSecret(env.REFRESH_TOKEN_SECRET)) {
    invalid.push("REFRESH_TOKEN_SECRET deve ser forte em producao");
  }

  if (missing.length > 0 || invalid.length > 0) {
    const details = [
      missing.length ? `Variaveis ausentes: ${missing.join(", ")}` : null,
      invalid.length ? `Variaveis invalidas: ${invalid.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join(". ");

    throw new Error(`Configuracao invalida. ${details}`);
  }

  return {
    allowedOrigins,
    isProd,
    nodeEnv,
  };
}

module.exports = {
  splitCsv,
  validateAppEnv,
};
