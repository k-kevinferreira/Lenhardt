const db = require("../config/db");
const { trimToString } = require("../utils/validation");

const normalizePlaca = (p) =>
  String(p || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]+/g, "");

const isValidDate = (value) => {
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM veiculos ORDER BY id DESC");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar veículos" });
  }
};

exports.criar = async (req, res) => {
  try {
    let { placa, nome_cliente, veiculo, ultimo_servico, data_ultimo_servico, observacao } = req.body;

    placa = normalizePlaca(placa);
    nome_cliente = trimToString(nome_cliente, 160);
    veiculo = trimToString(veiculo, 160);
    ultimo_servico = trimToString(ultimo_servico, 160);
    observacao = trimToString(observacao, 2000);
    data_ultimo_servico = data_ultimo_servico || null;

    if (!placa || !nome_cliente || !veiculo) {
      return res.status(400).json({ message: "Campos obrigatórios faltando" });
    }
    if (!/^[A-Z0-9]{7,8}$/.test(placa)) {
      return res.status(400).json({ message: "Placa inválida" });
    }
    if (data_ultimo_servico && !isValidDate(data_ultimo_servico)) {
      return res.status(400).json({ message: "Data do último serviço inválida" });
    }

    const [exists] = await db.query("SELECT id FROM veiculos WHERE placa = ? LIMIT 1", [placa]);
    if (exists.length > 0) {
      return res.status(409).json({ message: "Já existe um veículo cadastrado com essa placa" });
    }

    const sql = `
      INSERT INTO veiculos (placa, nome_cliente, veiculo, ultimo_servico, data_ultimo_servico, observacao)
      VALUES (?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const [result] = await db.query(sql, [
      placa,
      nome_cliente,
      veiculo,
      ultimo_servico || null,
      data_ultimo_servico,
      observacao || null,
    ]);

    return res.status(201).json({ message: "Veículo criado", id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar veículo" });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    let { placa, nome_cliente, veiculo, ultimo_servico, data_ultimo_servico, observacao } = req.body;

    placa = normalizePlaca(placa);
    nome_cliente = trimToString(nome_cliente, 160);
    veiculo = trimToString(veiculo, 160);
    ultimo_servico = trimToString(ultimo_servico, 160);
    observacao = trimToString(observacao, 2000);
    data_ultimo_servico = data_ultimo_servico || null;

    if (!placa || !nome_cliente || !veiculo) {
      return res.status(400).json({ message: "Campos obrigatórios faltando" });
    }
    if (!/^[A-Z0-9]{7,8}$/.test(placa)) {
      return res.status(400).json({ message: "Placa inválida" });
    }
    if (data_ultimo_servico && !isValidDate(data_ultimo_servico)) {
      return res.status(400).json({ message: "Data do último serviço inválida" });
    }

    const [dup] = await db.query("SELECT id FROM veiculos WHERE placa = ? AND id <> ? LIMIT 1", [placa, id]);
    if (dup.length > 0) {
      return res.status(409).json({ message: "Outra ficha já usa essa placa" });
    }

    const sql = `
      UPDATE veiculos
      SET placa=?, nome_cliente=?, veiculo=?, ultimo_servico=?, data_ultimo_servico=?, observacao=?
      WHERE id=?
    `;

    const [result] = await db.query(sql, [
      placa,
      nome_cliente,
      veiculo,
      ultimo_servico || null,
      data_ultimo_servico,
      observacao || null,
      id,
    ]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Veículo não encontrado" });
    return res.json({ message: "Veículo atualizado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar veículo" });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM veiculos WHERE id=?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Veículo não encontrado" });
    return res.json({ message: "Veículo excluído" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir veículo" });
  }
};

/**
 * NOVO: Histórico de um veículo
 * GET /api/veiculos/:id/historico
 *
 * Retorna:
 * - dados do veículo
 * - lista de agendamentos desse veículo
 * - com pagamento vinculado (quando existir)
 */
exports.historico = async (req, res) => {
  try {
    const veiculoId = Number(req.params.id);

    if (!Number.isInteger(veiculoId) || veiculoId <= 0) {
      return res.status(400).json({ message: "ID de veículo inválido" });
    }

    // 1) Confere se o veículo existe (evita histórico “vazio” por ID errado)
    const [vRows] = await db.query("SELECT * FROM veiculos WHERE id = ? LIMIT 1", [veiculoId]);
    if (vRows.length === 0) {
      return res.status(404).json({ message: "Veículo não encontrado" });
    }

    // 2) Histórico (agendamentos) + pagamento (real)
    // IMPORTANTE: esse JOIN pressupõe que pagamentos tem agendamento_id.
    const [rows] = await db.query(
      `
      SELECT
        a.id AS agendamento_id,
        a.data AS data_servico,
        a.servico,
        a.status AS status_agendamento,
        a.valor AS valor_previsto,

        p.id AS pagamento_id,
        p.status AS status_pagamento,
        p.valor AS valor_pago,
        p.data_pagamento

      FROM agendamentos a
      LEFT JOIN pagamentos p
        ON p.agendamento_id = a.id
      WHERE a.veiculo_id = ?
      ORDER BY a.data DESC
      `,
      [veiculoId]
    );

    // 3) Resumo rápido (somente o que foi realmente pago)
    const totalPago = rows.reduce((acc, r) => {
      if ((r.status_pagamento || "").toLowerCase() === "pago") {
        const v = Number(r.valor_pago);
        return acc + (Number.isFinite(v) ? v : 0);
      }
      return acc;
    }, 0);

    return res.json({
      veiculo: vRows[0],
      total_pago: totalPago,
      historico: rows,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar histórico do veículo" });
  }
};
