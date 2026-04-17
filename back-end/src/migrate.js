require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("./config/db");

async function main() {
  const migrationsDir = path.resolve(__dirname, "..", "migrations");
  const files = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) {
    console.log("Nenhuma migration encontrada.");
    return;
  }

  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8").trim();
      if (!sql) continue;

      console.log(`Aplicando ${file}...`);
      await db.query(sql);
    }

    console.log("Migrations aplicadas com sucesso.");
  } catch (err) {
    console.error("Erro ao aplicar migrations:", err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
