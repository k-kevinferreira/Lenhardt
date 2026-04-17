const db = require("../config/db");
const bcrypt = require("bcryptjs");
const {
  trimToString,
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isValidPhone,
} = require("../utils/validation");

const SERVICOS = {
  "Polimento Técnico": 350,
  "Vitrificação Automotiva": 900,
  "Higienização Interna": 180,
  "Lavagem Detalhada": 120,
  "Proteção de Pintura": 450,
};

function isValidDate(value) {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

exports.criarAgendamentoPublico = async (req, res) => {
  try {
    const nome = trimToString(req.body?.nome, 160);
    const email = normalizeEmail(req.body?.email);
    const telefone = normalizePhone(req.body?.telefone);
    const veiculo = trimToString(req.body?.veiculo, 160);
    const servico = trimToString(req.body?.servico, 160);
    const data = req.body?.data;
    const observacoes = trimToString(req.body?.observacoes, 1000);

    if (!nome || !telefone || !veiculo || !servico || !data) {
      return res.status(400).json({ message: "Preencha nome, telefone, veículo, serviço e data" });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "E-mail inválido" });
    }
    if (!isValidPhone(telefone)) {
      return res.status(400).json({ message: "Telefone inválido" });
    }

    if (!isValidDate(data)) {
      return res.status(400).json({ message: "Data inválida" });
    }

    const valor = SERVICOS[servico];
    if (!valor) {
      return res.status(400).json({ message: "Serviço inválido" });
    }

    const observacaoFinal = [`Veículo informado no site: ${veiculo}`];
    if (observacoes) observacaoFinal.push(observacoes);

    const sql = `
      INSERT INTO agendamentos (nome, email, telefone, veiculo_id, servico, data, valor, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?)
      RETURNING id
    `;

    const [result] = await db.query(sql, [
      nome,
      email || null,
      telefone,
      null,
      servico,
      data,
      valor,
      observacaoFinal.join(" | "),
    ]);

    return res.status(201).json({
      message: "Agendamento enviado com sucesso",
      id: result.insertId,
      valor_estimado: valor,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao enviar agendamento" });
  }
};

exports.criarContatoPublico = async (req, res) => {
  try {
    const nome = trimToString(req.body?.nome, 160);
    const email = normalizeEmail(req.body?.email);
    const telefone = normalizePhone(req.body?.telefone);
    const mensagem = trimToString(req.body?.mensagem, 2000);

    if (!nome || !email || !telefone || !mensagem) {
      return res.status(400).json({ message: "Preencha nome, e-mail, telefone e mensagem" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "E-mail inválido" });
    }
    if (!isValidPhone(telefone)) {
      return res.status(400).json({ message: "Telefone inválido" });
    }

    await db.query(
      `
      INSERT INTO contatos (nome, email, telefone, mensagem)
      VALUES (?, ?, ?, ?)
      RETURNING id
      `,
      [
        nome,
        email,
        telefone,
        mensagem,
      ]
    );

    return res.status(201).json({ message: "Mensagem enviada com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao enviar mensagem" });
  }
};

exports.criarSolicitacaoAcessoPublica = async (req, res) => {
  try {
    const nome = trimToString(req.body?.nome, 120);
    const email = normalizeEmail(req.body?.email);
    const telefone = normalizePhone(req.body?.telefone);
    const senha = trimToString(req.body?.senha, 255);
    const observacoes = trimToString(req.body?.observacoes, 1000);

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Preencha nome, e-mail e senha" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "E-mail inválido" });
    }
    if (telefone && !isValidPhone(telefone)) {
      return res.status(400).json({ message: "Telefone inválido" });
    }
    if (senha.length < 6) {
      return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres" });
    }

    const [admins] = await db.query(
      "SELECT id FROM admins WHERE email = ? LIMIT 1",
      [email]
    );
    if (admins.length > 0) {
      return res.status(409).json({ message: "Este e-mail já possui acesso ao sistema" });
    }

    const [pendentes] = await db.query(
      "SELECT id FROM solicitacoes_acesso WHERE email = ? AND status = 'pendente' LIMIT 1",
      [email]
    );
    if (pendentes.length > 0) {
      return res.status(409).json({ message: "Já existe uma solicitação pendente para este e-mail" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      `
      INSERT INTO solicitacoes_acesso (nome, email, telefone, senha_hash, observacoes, status)
      VALUES (?, ?, ?, ?, ?, 'pendente')
      RETURNING id
      `,
      [nome, email, telefone || null, senhaHash, observacoes || null]
    );

    return res.status(201).json({
      message: "Solicitação enviada com sucesso. Aguarde a liberação de um administrador.",
      id: result.insertId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao enviar solicitação de acesso" });
  }
};
