require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/db");

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function main() {
  const [, , emailArg, senhaArg, roleArg] = process.argv;
  const email = normalizeEmail(emailArg);
  const senha = String(senhaArg || "").trim();
  const role = String(roleArg || "admin").trim().toLowerCase();

  if (!email || !senha) {
    console.error("Uso: node src/create-admin.js <email> <senha> [admin|operador]");
    process.exitCode = 1;
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("E-mail inválido.");
    process.exitCode = 1;
    return;
  }

  if (senha.length < 6) {
    console.error("A senha deve ter pelo menos 6 caracteres.");
    process.exitCode = 1;
    return;
  }

  if (!["admin", "operador"].includes(role)) {
    console.error("Role invalida. Use admin ou operador.");
    process.exitCode = 1;
    return;
  }

  try {
    const [exists] = await db.query(
      "SELECT id FROM admins WHERE email = ? LIMIT 1",
      [email]
    );

    if (exists.length > 0) {
      console.error("Já existe um admin com esse e-mail.");
      process.exitCode = 1;
      return;
    }

    const hash = await bcrypt.hash(senha, 10);

    const [result] = await db.query(
      "INSERT INTO admins (email, senha, role) VALUES (?, ?, ?) RETURNING id",
      [email, hash, role]
    );

    console.log(`Usuario criado com sucesso. ID: ${result.insertId} | E-mail: ${email} | Role: ${role}`);
  } catch (err) {
    console.error("Erro ao criar admin:", err.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
