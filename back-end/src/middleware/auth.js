const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({ message: "Nao autenticado" });
    }

    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = Number(payload?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Sessao invalida" });
    }

    const [rows] = await db.query(
      "SELECT id, email, ativo, role FROM admins WHERE id = ? LIMIT 1",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Sessao invalida" });
    }

    const admin = rows[0];
    if (!Number(admin.ativo)) {
      return res.status(401).json({ message: "Usuario desativado" });
    }

    req.user = {
      id: Number(admin.id),
      email: admin.email,
      role: String(admin.role || "operador").trim().toLowerCase(),
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Sessao invalida" });
  }
};
