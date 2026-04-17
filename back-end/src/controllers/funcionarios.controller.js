const db = require("../config/db");
const {
  trimToString,
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isValidPhone,
} = require("../utils/validation");

const STATUS = new Set(["ativo", "inativo"]);

function limparTexto(valor) {
  return String(valor || "").trim();
}

function normalizarStatus(valor) {
  const status = limparTexto(valor).toLowerCase() || "ativo";
  return STATUS.has(status) ? status : null;
}

async function prepararPayload(body) {
  const nome = trimToString(body.nome, 120);
  const cargo = trimToString(body.cargo, 80);
  const email = normalizeEmail(body.email);
  const telefone = normalizePhone(body.telefone);
  const observacoes = trimToString(body.observacoes, 2000);
  const status = normalizarStatus(body.status);

  if (!nome) return { erro: "Nome e obrigatorio" };
  if (!cargo) return { erro: "Cargo e obrigatorio" };
  if (email && !isValidEmail(email)) return { erro: "Email invalido" };
  if (telefone && !isValidPhone(telefone)) return { erro: "Telefone invalido" };
  if (!status) return { erro: "Status invalido" };

  return {
    nome,
    cargo,
    email: email || null,
    telefone: telefone || null,
    status,
    observacoes: observacoes || null,
  };
}

exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM funcionarios ORDER BY nome ASC, id DESC");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar funcionarios" });
  }
};

exports.criar = async (req, res) => {
  try {
    const payload = await prepararPayload(req.body);
    if (payload.erro) return res.status(400).json({ message: payload.erro });

    const [result] = await db.query(
      `
      INSERT INTO funcionarios (nome, cargo, email, telefone, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
      `,
      [
        payload.nome,
        payload.cargo,
        payload.email,
        payload.telefone,
        payload.status,
        payload.observacoes,
      ]
    );

    return res.status(201).json({ message: "Funcionario criado", id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar funcionario" });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const payload = await prepararPayload(req.body);
    if (payload.erro) return res.status(400).json({ message: payload.erro });

    const [result] = await db.query(
      `
      UPDATE funcionarios
      SET nome = ?, cargo = ?, email = ?, telefone = ?, status = ?, observacoes = ?
      WHERE id = ?
      `,
      [
        payload.nome,
        payload.cargo,
        payload.email,
        payload.telefone,
        payload.status,
        payload.observacoes,
        req.params.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Funcionario nao encontrado" });
    }

    return res.json({ message: "Funcionario atualizado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar funcionario" });
  }
};

exports.excluir = async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM funcionarios WHERE id = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Funcionario nao encontrado" });
    }

    return res.json({ message: "Funcionario excluido" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir funcionario" });
  }
};
