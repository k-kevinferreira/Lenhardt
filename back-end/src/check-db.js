require("dotenv").config();

const db = require("./config/db");

async function main() {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    console.log("Banco conectado com sucesso.");
    console.log(`Horário do banco: ${rows[0]?.now || "indisponivel"}`);
  } catch (err) {
    console.error("Falha na conexão com o banco:", err.code || err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
