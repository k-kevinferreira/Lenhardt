const db = require("../config/db");

const STATUS = new Set(["ok", "baixo", "sem_estoque"]);

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const isValidDate = (value) => {
  if (!value) return true;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

const statusFromQuantidade = (qtd) => {
  const q = Number(qtd);
  if (q <= 0) return "sem_estoque";
  if (q <= 5) return "baixo";
  return "ok";
};

exports.listar = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM produtos ORDER BY updated_at DESC, id DESC");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar produtos" });
  }
};

exports.criar = async (req, res) => {
  try {
    let { produto, quantidade, data_compra, valor_gasto } = req.body;

    produto = String(produto || "").trim();
    if (!produto) return res.status(400).json({ message: "Campo produto é obrigatório" });

    const qtd = toNumber(quantidade);
    if (!Number.isFinite(qtd) || qtd < 0) {
      return res.status(400).json({ message: "Quantidade inválida" });
    }

    let val = null;
    if (valor_gasto !== undefined && valor_gasto !== null && valor_gasto !== "") {
      val = toNumber(valor_gasto);
      if (!Number.isFinite(val) || val < 0) {
        return res.status(400).json({ message: "Valor gasto inválido" });
      }
    } else {
      val = 0;
    }

    if (!isValidDate(data_compra)) {
      return res.status(400).json({ message: "Data da compra inválida" });
    }

    const st = statusFromQuantidade(qtd);
    if (!STATUS.has(st)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const sql = `
      INSERT INTO produtos (produto, quantidade, data_compra, valor_gasto, status)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id
    `;

    const [result] = await db.query(sql, [produto, qtd, data_compra || null, val, st]);
    return res.status(201).json({ message: "Produto criado", id: result.insertId, status: st });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar produto" });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    let { produto, quantidade, data_compra, valor_gasto } = req.body;

    produto = String(produto || "").trim();
    if (!produto) return res.status(400).json({ message: "Campo produto é obrigatório" });

    const qtd = toNumber(quantidade);
    if (!Number.isFinite(qtd) || qtd < 0) {
      return res.status(400).json({ message: "Quantidade inválida" });
    }

    let val = null;
    if (valor_gasto !== undefined && valor_gasto !== null && valor_gasto !== "") {
      val = toNumber(valor_gasto);
      if (!Number.isFinite(val) || val < 0) {
        return res.status(400).json({ message: "Valor gasto inválido" });
      }
    } else {
      val = 0;
    }

    if (!isValidDate(data_compra)) {
      return res.status(400).json({ message: "Data da compra inválida" });
    }

    const st = statusFromQuantidade(qtd);
    if (!STATUS.has(st)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const sql = `
      UPDATE produtos
      SET produto = ?, quantidade = ?, data_compra = ?, valor_gasto = ?, status = ?
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [produto, qtd, data_compra || null, val, st, id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Produto não encontrado" });
    return res.json({ message: "Produto atualizado", status: st });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar produto" });
  }
};

exports.excluir = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query("DELETE FROM produtos WHERE id = ?", [id]);

    if (result.affectedRows === 0) return res.status(404).json({ message: "Produto não encontrado" });
    return res.json({ message: "Produto excluído" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir produto" });
  }
};
