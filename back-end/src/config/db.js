const { Pool } = require("pg");

function toPgPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function normalizeResult(result) {
  const command = String(result.command || "").toUpperCase();

  if (command === "SELECT") {
    return result.rows;
  }

  return {
    affectedRows: result.rowCount || 0,
    rowCount: result.rowCount || 0,
    insertId: result.rows?.[0]?.id ?? null,
    rows: result.rows || [],
  };
}

function createClientFacade(client, release) {
  return {
    async query(sql, params = []) {
      const result = await client.query(toPgPlaceholders(sql), params);
      return [normalizeResult(result)];
    },
    async beginTransaction() {
      await client.query("BEGIN");
    },
    async commit() {
      await client.query("COMMIT");
    },
    async rollback() {
      await client.query("ROLLBACK");
    },
    release() {
      if (typeof release === "function") release();
    },
  };
}

const isProd = process.env.NODE_ENV === "production";

const connectionString =
  process.env.DATABASE_URL ||
  [
    "postgresql://",
    encodeURIComponent(process.env.DB_USER || ""),
    process.env.DB_PASS ? `:${encodeURIComponent(process.env.DB_PASS)}` : "",
    "@",
    process.env.DB_HOST || "localhost",
    process.env.DB_PORT ? `:${process.env.DB_PORT}` : "",
    "/",
    process.env.DB_NAME || "",
  ].join("");

const pool = new Pool({
  connectionString,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX || 10),
});

module.exports = {
  async query(sql, params = []) {
    const result = await pool.query(toPgPlaceholders(sql), params);
    return [normalizeResult(result)];
  },
  async getConnection() {
    const client = await pool.connect();
    return createClientFacade(client, () => client.release());
  },
  async end() {
    await pool.end();
  },
};
