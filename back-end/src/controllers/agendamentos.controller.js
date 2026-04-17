const db = require("../config/db");
const {
  trimToString,
  normalizeEmail,
  isValidEmail,
  normalizePhone,
  isValidPhone,
} = require("../utils/validation");

const STATUS = new Set(["pendente", "confirmado", "cancelado", "reagendado", "concluido"]);

const isValidDate = (value) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const toMoney = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM agendamentos ORDER BY data DESC, id DESC");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar agendamentos" });
  }
};

exports.criar = async (req, res) => {
  try {
    const nome = trimToString(req.body?.nome, 160);
    const email = normalizeEmail(req.body?.email);
    const telefone = normalizePhone(req.body?.telefone);
    const veiculo_id = req.body?.veiculo_id;
    const servico = trimToString(req.body?.servico, 160);
    const data = req.body?.data;
    const valor = req.body?.valor;
    const observacoes = trimToString(req.body?.observacoes, 1000);

    if (!nome || !telefone || !servico || !data) {
      return res.status(400).json({ message: "Campos obrigatórios: nome, telefone, servico, data" });
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

    const val = toMoney(valor);
    if (!Number.isFinite(val) || val <= 0) {
      return res.status(400).json({ message: "Informe um valor válido" });
    }

    const vid = Number(veiculo_id);
    if (!Number.isFinite(vid) || vid <= 0) {
      return res.status(400).json({ message: "Selecione um veículo válido" });
    }

    const sql = `
      INSERT INTO agendamentos (nome, email, telefone, veiculo_id, servico, data, valor, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?)
      RETURNING id
    `;

    const [result] = await db.query(sql, [
      nome,
      email || null,
      telefone,
      vid,
      servico,
      data,
      val,
      observacoes || null,
    ]);

    return res.status(201).json({ message: "Agendamento criado", id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar agendamento" });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const nome = trimToString(req.body?.nome, 160);
    const email = normalizeEmail(req.body?.email);
    const telefone = normalizePhone(req.body?.telefone);
    const servico = trimToString(req.body?.servico, 160);
    const data = req.body?.data;
    const valor = req.body?.valor;
    const status = req.body?.status;
    const observacoes = trimToString(req.body?.observacoes, 1000);

    if (!nome || !telefone || !servico || !data) {
      return res.status(400).json({ message: "Campos obrigatórios: nome, telefone, servico, data" });
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

    const val = toMoney(valor);
    if (!Number.isFinite(val) || val <= 0) {
      return res.status(400).json({ message: "Informe um valor válido" });
    }

    const st = status ? String(status).toLowerCase() : "pendente";
    if (!STATUS.has(st)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const sql = `
      UPDATE agendamentos
      SET nome=?, email=?, telefone=?, servico=?, data=?, valor=?, status=?, observacoes=?
      WHERE id=?
    `;

    const [result] = await db.query(sql, [
      nome,
      email || null,
      telefone,
      servico,
      data,
      val,
      st,
      observacoes || null,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    return res.json({ message: "Agendamento atualizado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar agendamento" });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM agendamentos WHERE id=?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Agendamento não encontrado" });
    return res.json({ message: "Agendamento excluído" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir agendamento" });
  }
};

exports.confirmar = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("UPDATE agendamentos SET status='confirmado' WHERE id=?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Agendamento não encontrado" });
    return res.json({ message: "Agendamento confirmado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao confirmar" });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("UPDATE agendamentos SET status='cancelado' WHERE id=?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Agendamento não encontrado" });
    return res.json({ message: "Agendamento cancelado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao cancelar" });
  }
};

exports.reagendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) return res.status(400).json({ message: "Informe a nova data" });
    if (!isValidDate(data)) return res.status(400).json({ message: "Data inválida" });

    const [result] = await db.query(
      "UPDATE agendamentos SET data=?, status='reagendado' WHERE id=?",
      [data, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: "Agendamento não encontrado" });
    return res.json({ message: "Agendamento reagendado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao reagendar" });
  }
};

exports.concluir = async (req, res) => {
  const { id } = req.params;
  const { valor, data_pagamento, status } = req.body;

  const pagamentoStatus = (status || "pago").toString().toLowerCase();
  const dataPg = data_pagamento || new Date();

  const PAGAMENTO_STATUS = new Set(["pago", "pendente", "estornado"]);
  if (!PAGAMENTO_STATUS.has(pagamentoStatus)) {
    return res.status(400).json({ message: "Status de pagamento inválido" });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [agRows] = await conn.query(
      "SELECT nome, servico, valor, status, veiculo_id, data, observacoes FROM agendamentos WHERE id = ? LIMIT 1",
      [id]
    );

    if (agRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Agendamento não encontrado" });
    }

    const agendamento = agRows[0];
    const stAtual = (agendamento.status || "").toLowerCase();

    if (stAtual === "cancelado") {
      await conn.rollback();
      return res.status(409).json({ message: "Agendamento cancelado não pode ser concluído" });
    }

    if (stAtual === "concluido") {
      const [pExists] = await conn.query(
        "SELECT id FROM pagamentos WHERE agendamento_id = ? LIMIT 1",
        [id]
      );

      await conn.commit();
      return res.status(409).json({
        message:
          pExists.length > 0
            ? "Este agendamento já foi concluído e já possui pagamento."
            : "Este agendamento já foi concluído.",
      });
    }

    const bodyVal = valor === undefined || valor === null || valor === "" ? NaN : toMoney(valor);
    const valorFinal = Number.isFinite(bodyVal) && bodyVal > 0 ? bodyVal : Number(agendamento.valor);

    if (!Number.isFinite(valorFinal) || valorFinal <= 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Agendamento sem valor válido. Informe um valor." });
    }

    const [payDup] = await conn.query(
      "SELECT id FROM pagamentos WHERE agendamento_id = ? LIMIT 1",
      [id]
    );
    if (payDup.length > 0) {
      await conn.rollback();
      return res.status(409).json({ message: "Já existe pagamento registrado para este agendamento" });
    }

    const [up] = await conn.query(
      "UPDATE agendamentos SET status = 'concluido' WHERE id = ?",
      [id]
    );

    if (up.affectedRows === 0) {
      await conn.rollback();
      return res.status(400).json({ message: "Não foi possível concluir o agendamento" });
    }

    await conn.query(
      `
      INSERT INTO pagamentos
      (agendamento_id, nome_cliente, servico, valor, data_pagamento, status)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
      `,
      [id, agendamento.nome, agendamento.servico, valorFinal, dataPg, pagamentoStatus]
    );

    if (agendamento.veiculo_id) {
      await conn.query(
        `
        UPDATE veiculos
        SET ultimo_servico = ?,
            data_ultimo_servico = ?,
            observacao = ?
        WHERE id = ?
        `,
        [
          agendamento.servico || null,
          agendamento.data || null,
          agendamento.observacoes || null,
          agendamento.veiculo_id,
        ]
      );
    }

    await conn.commit();
    return res.json({ message: "Agendamento concluído, pagamento registrado e histórico atualizado" });
  } catch (err) {
    console.error(err);
    await conn.rollback();
    return res.status(500).json({ message: "Erro ao concluir agendamento" });
  } finally {
    conn.release();
  }
};
