const db = require("../config/db");

function anoAtual() {
  return new Date().getFullYear();
}

const STATUS_ABERTO = ["pendente", "confirmado", "reagendado"];

exports.resumo = async (req, res) => {
  try {
    const ano = parseInt(req.query.ano || anoAtual(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);

    const semestre = mes <= 6 ? 1 : 2;
    const semestreInicio = semestre === 1 ? 1 : 7;
    const semestreFim = semestre === 1 ? 6 : 12;

    const sqlMensal = `
      SELECT
        COALESCE(SUM(valor), 0) AS faturamento_mensal,
        COUNT(*) AS qtd_pagamentos_mensal,
        COALESCE(AVG(valor), 0) AS ticket_medio_mensal
      FROM pagamentos
      WHERE status = 'pago'
        AND EXTRACT(YEAR FROM data_pagamento) = ?
        AND EXTRACT(MONTH FROM data_pagamento) = ?
    `;

    const sqlSemestral = `
      SELECT COALESCE(SUM(valor), 0) AS faturamento_semestral
      FROM pagamentos
      WHERE status = 'pago'
        AND EXTRACT(YEAR FROM data_pagamento) = ?
        AND EXTRACT(MONTH FROM data_pagamento) BETWEEN ? AND ?
    `;

    const sqlAnual = `
      SELECT COALESCE(SUM(valor), 0) AS faturamento_anual
      FROM pagamentos
      WHERE status = 'pago'
        AND EXTRACT(YEAR FROM data_pagamento) = ?
    `;

    const sqlPrevMensal = `
      SELECT
        COALESCE(SUM(valor), 0) AS previsto_mensal,
        COUNT(*) AS qtd_agendamentos_mensal_abertos
      FROM agendamentos
      WHERE status IN (?, ?, ?)
        AND EXTRACT(YEAR FROM data) = ?
        AND EXTRACT(MONTH FROM data) = ?
    `;

    const sqlPrevSemestral = `
      SELECT COALESCE(SUM(valor), 0) AS previsto_semestral
      FROM agendamentos
      WHERE status IN (?, ?, ?)
        AND EXTRACT(YEAR FROM data) = ?
        AND EXTRACT(MONTH FROM data) BETWEEN ? AND ?
    `;

    const sqlPrevAnual = `
      SELECT COALESCE(SUM(valor), 0) AS previsto_anual
      FROM agendamentos
      WHERE status IN (?, ?, ?)
        AND EXTRACT(YEAR FROM data) = ?
    `;

    const [[r1]] = await db.query(sqlMensal, [ano, mes]);
    const [[r2]] = await db.query(sqlSemestral, [ano, semestreInicio, semestreFim]);
    const [[r3]] = await db.query(sqlAnual, [ano]);

    const [[p1]] = await db.query(sqlPrevMensal, [...STATUS_ABERTO, ano, mes]);
    const [[p2]] = await db.query(sqlPrevSemestral, [...STATUS_ABERTO, ano, semestreInicio, semestreFim]);
    const [[p3]] = await db.query(sqlPrevAnual, [...STATUS_ABERTO, ano]);

    return res.json({
      ano,
      mes,
      semestre,
      faturamento_mensal: Number(r1.faturamento_mensal),
      faturamento_semestral: Number(r2.faturamento_semestral),
      faturamento_anual: Number(r3.faturamento_anual),
      qtd_pagamentos_mensal: Number(r1.qtd_pagamentos_mensal),
      ticket_medio_mensal: Number(r1.ticket_medio_mensal),
      previsto_mensal: Number(p1.previsto_mensal),
      previsto_semestral: Number(p2.previsto_semestral),
      previsto_anual: Number(p3.previsto_anual),
      qtd_agendamentos_mensal_abertos: Number(p1.qtd_agendamentos_mensal_abertos),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no resumo do dashboard" });
  }
};

exports.faturamentoPorMes = async (req, res) => {
  try {
    const ano = parseInt(req.query.ano || anoAtual(), 10);

    const sql = `
      SELECT EXTRACT(MONTH FROM data_pagamento)::INT AS mes, COALESCE(SUM(valor), 0) AS total
      FROM pagamentos
      WHERE status = 'pago'
        AND EXTRACT(YEAR FROM data_pagamento) = ?
      GROUP BY EXTRACT(MONTH FROM data_pagamento)
      ORDER BY mes
    `;

    const [rows] = await db.query(sql, [ano]);

    const data = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
    rows.forEach((r) => {
      data[r.mes - 1].total = Number(r.total);
    });

    return res.json({ ano, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar faturamento por mÃªs" });
  }
};

exports.servicosMaisVendidos = async (req, res) => {
  try {
    const ano = parseInt(req.query.ano || anoAtual(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);

    const sql = `
      SELECT servico, COUNT(*) AS qtd, COALESCE(SUM(valor), 0) AS total
      FROM pagamentos
      WHERE status = 'pago'
        AND EXTRACT(YEAR FROM data_pagamento) = ?
        AND EXTRACT(MONTH FROM data_pagamento) = ?
      GROUP BY servico
      ORDER BY qtd DESC
      LIMIT 5
    `;

    const [rows] = await db.query(sql, [ano, mes]);

    return res.json({
      ano,
      mes,
      data: rows.map((r) => ({
        servico: r.servico,
        qtd: Number(r.qtd),
        total: Number(r.total),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar serviÃ§os mais vendidos" });
  }
};
