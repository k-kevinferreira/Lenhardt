const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { writeAuditLog } = require("../utils/audit");
const { normalizeEmail, isValidEmail, trimToString } = require("../utils/validation");

const ADMIN_ROLES = new Set(["admin", "operador"]);

function normalizeRole(value, fallback = "operador") {
  const role = String(value || fallback).trim().toLowerCase();
  return ADMIN_ROLES.has(role) ? role : null;
}

function serializeUser(admin) {
  return {
    id: Number(admin.id),
    email: admin.email,
    role: normalizeRole(admin.role, "operador"),
  };
}

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_TTL || "15m",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || "30d",
  });
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function refreshExpiresAt() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function resetLoginAttempts(req) {
  const limiter = req.app?.locals?.loginLimiter;
  if (limiter && typeof limiter.resetKey === "function") {
    limiter.resetKey(req.ip);
  }
}

function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    // Keep the refresh cookie scoped to auth endpoints, but broad enough
    // to survive the login -> dashboard -> next page flow reliably.
    path: "/api/auth",
  };
}

function clearRefreshCookie(res) {
  res.clearCookie("refresh_token", refreshCookieOptions());
}

async function insertAdminHash(email, hash, role = "operador") {
  const [result] = await db.query(
    "INSERT INTO admins (email, senha, ativo, role) VALUES (?, ?, 1, ?) RETURNING id",
    [email, hash, normalizeRole(role, "operador")]
  );
  return result.insertId;
}

async function countActiveAdmins() {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS total FROM admins WHERE ativo = 1 AND role = 'admin'"
  );
  return Number(row.total || 0);
}

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const senha = trimToString(req.body?.senha, 255);

    if (!email || !senha || !isValidEmail(email)) {
      await writeAuditLog({
        actorEmail: email || null,
        action: "auth.login",
        targetType: "admin",
        status: "failure",
        details: { reason: "invalid_credentials_payload" },
        req,
      });
      return res.status(400).json({ message: "Credenciais invalidas" });
    }

    const [rows] = await db.query(
      "SELECT id, email, senha, ativo, role FROM admins WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      await writeAuditLog({
        actorEmail: email,
        action: "auth.login",
        targetType: "admin",
        status: "failure",
        details: { reason: "user_not_found" },
        req,
      });
      return res.status(401).json({ message: "Usuario ou senha invalidos" });
    }

    const admin = rows[0];
    if (!Number(admin.ativo)) {
      await writeAuditLog({
        actorAdminId: admin.id,
        actorEmail: admin.email,
        action: "auth.login",
        targetType: "admin",
        targetId: admin.id,
        status: "failure",
        details: { reason: "user_disabled" },
        req,
      });
      return res.status(403).json({ message: "Usuario desativado" });
    }

    const ok = await bcrypt.compare(senha, admin.senha);
    if (!ok) {
      await writeAuditLog({
        actorAdminId: admin.id,
        actorEmail: admin.email,
        action: "auth.login",
        targetType: "admin",
        targetId: admin.id,
        status: "failure",
        details: { reason: "wrong_password" },
        req,
      });
      return res.status(401).json({ message: "Usuario ou senha invalidos" });
    }

    const user = serializeUser(admin);
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken({ id: admin.id });

    await db.query(
      "DELETE FROM refresh_tokens WHERE user_id = ? AND (revoked = 1 OR expires_at <= CURRENT_TIMESTAMP)",
      [admin.id]
    );
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?) RETURNING id",
      [admin.id, hashToken(refreshToken), refreshExpiresAt()]
    );

    resetLoginAttempts(req);
    res.cookie("refresh_token", refreshToken, refreshCookieOptions());

    await writeAuditLog({
      actorAdminId: admin.id,
      actorEmail: admin.email,
      action: "auth.login",
      targetType: "admin",
      targetId: admin.id,
      details: { role: user.role },
      req,
    });

    return res.json({
      accessToken,
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro no login" });
  }
};

exports.refresh = async (req, res) => {
  const conn = await db.getConnection();
  let inTransaction = false;

  try {
    const token = req.cookies.refresh_token;
    if (!token) return res.status(401).json({ message: "Nao autenticado" });

    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const hash = hashToken(token);

    await conn.beginTransaction();
    inTransaction = true;

    const [rows] = await conn.query(
      "SELECT id FROM refresh_tokens WHERE user_id = ? AND token_hash = ? AND revoked = 0 AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
      [payload.id, hash]
    );

    if (rows.length === 0) {
      await conn.rollback();
      inTransaction = false;
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Sessao invalida" });
    }

    const [admins] = await conn.query(
      "SELECT id, email, ativo, role FROM admins WHERE id = ? LIMIT 1",
      [payload.id]
    );

    if (admins.length === 0 || !Number(admins[0].ativo)) {
      await conn.rollback();
      inTransaction = false;
      clearRefreshCookie(res);
      return res.status(401).json({ message: "Sessao invalida" });
    }

    const admin = admins[0];
    const user = serializeUser(admin);
    const newRefreshToken = signRefreshToken({ id: admin.id });
    const newAccessToken = signAccessToken(user);

    await conn.query("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?", [rows[0].id]);
    await conn.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?) RETURNING id",
      [admin.id, hashToken(newRefreshToken), refreshExpiresAt()]
    );
    await conn.query(
      "DELETE FROM refresh_tokens WHERE user_id = ? AND (revoked = 1 OR expires_at <= CURRENT_TIMESTAMP)",
      [admin.id]
    );

    await conn.commit();
    inTransaction = false;
    res.cookie("refresh_token", newRefreshToken, refreshCookieOptions());

    return res.json({
      accessToken: newAccessToken,
      user,
    });
  } catch (err) {
    if (inTransaction) await conn.rollback();
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Sessao expirada" });
  } finally {
    conn.release();
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refresh_token;
    let actorAdminId = null;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        actorAdminId = Number(payload?.id) || null;
      } catch {
        actorAdminId = null;
      }

      await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?", [hashToken(token)]);
    }

    clearRefreshCookie(res);
    await writeAuditLog({
      actorAdminId,
      action: "auth.logout",
      targetType: "admin",
      targetId: actorAdminId,
      req,
    });
    return res.json({ message: "Logout realizado" });
  } catch (err) {
    return res.status(500).json({ message: "Erro ao sair" });
  }
};

exports.me = async (req, res) => {
  return res.json({ user: serializeUser(req.user || {}) });
};

exports.criarAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const senha = trimToString(req.body?.senha, 255);
    const role = normalizeRole(req.body?.role, "operador");

    if (!email || !senha || !isValidEmail(email)) {
      return res.status(400).json({ message: "Informe um e-mail valido." });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
    }

    if (!role) {
      return res.status(400).json({ message: "Perfil de acesso invalido." });
    }

    const [exists] = await db.query(
      "SELECT id FROM admins WHERE email = ? LIMIT 1",
      [email]
    );

    if (exists.length > 0) {
      return res.status(409).json({ message: "Ja existe um usuario com esse e-mail." });
    }

    const hash = await bcrypt.hash(senha, 10);
    const id = await insertAdminHash(email, hash, role);

    await writeAuditLog({
      actorAdminId: req.user?.id,
      actorEmail: req.user?.email,
      action: "admin.create",
      targetType: "admin",
      targetId: id,
      details: { email, role },
      req,
    });

    return res.status(201).json({ message: "Usuario criado com sucesso.", id, email, role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao criar usuario." });
  }
};

exports.listarAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT id, email, ativo, role, created_at
      FROM admins
      ORDER BY id ASC
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar usuarios." });
  }
};

exports.listarSolicitacoesAcesso = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        s.id,
        s.nome,
        s.email,
        s.telefone,
        s.observacoes,
        s.status,
        s.created_at
      FROM solicitacoes_acesso s
      WHERE s.status = 'pendente'
      ORDER BY s.created_at DESC
      `
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar solicitacoes de acesso." });
  }
};

exports.aprovarSolicitacaoAcesso = async (req, res) => {
  const conn = await db.getConnection();
  let inTransaction = false;

  try {
    const id = Number(req.params.id);
    const currentUserId = Number(req.user?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Solicitacao invalida." });
    }

    await conn.beginTransaction();
    inTransaction = true;

    const [rows] = await conn.query(
      `
      SELECT id, nome, email, telefone, senha_hash, status
      FROM solicitacoes_acesso
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      await conn.rollback();
      inTransaction = false;
      return res.status(404).json({ message: "Solicitacao nao encontrada." });
    }

    const solicitacao = rows[0];
    if (solicitacao.status !== "pendente") {
      await conn.rollback();
      inTransaction = false;
      return res.status(409).json({ message: "Esta solicitacao ja foi analisada." });
    }

    const [admins] = await conn.query(
      "SELECT id FROM admins WHERE email = ? LIMIT 1",
      [solicitacao.email]
    );

    if (admins.length > 0) {
      await conn.query(
        `
        UPDATE solicitacoes_acesso
        SET status = 'recusado', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = ?
        WHERE id = ?
        `,
        [currentUserId, id]
      );
      await conn.commit();
      inTransaction = false;
      return res.status(409).json({ message: "Ja existe um usuario com este e-mail." });
    }

    const [inserted] = await conn.query(
      "INSERT INTO admins (email, senha, ativo, role) VALUES (?, ?, 1, 'operador') RETURNING id",
      [solicitacao.email, solicitacao.senha_hash]
    );

    await conn.query(
      `
      UPDATE solicitacoes_acesso
      SET status = 'aprovado', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = ?
      WHERE id = ?
      `,
      [currentUserId, id]
    );

    await conn.commit();
    inTransaction = false;

    await writeAuditLog({
      actorAdminId: currentUserId,
      actorEmail: req.user?.email,
      action: "access_request.approve",
      targetType: "solicitacao_acesso",
      targetId: id,
      details: {
        email: solicitacao.email,
        createdAdminId: inserted.insertId,
        grantedRole: "operador",
      },
      req,
    });

    return res.json({ message: "Acesso liberado com sucesso." });
  } catch (err) {
    if (inTransaction) await conn.rollback();
    console.error(err);
    return res.status(500).json({ message: "Erro ao aprovar solicitacao de acesso." });
  } finally {
    conn.release();
  }
};

exports.recusarSolicitacaoAcesso = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentUserId = Number(req.user?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Solicitacao invalida." });
    }

    const [result] = await db.query(
      `
      UPDATE solicitacoes_acesso
      SET status = 'recusado', reviewed_at = CURRENT_TIMESTAMP, reviewed_by_admin_id = ?
      WHERE id = ? AND status = 'pendente'
      `,
      [currentUserId, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Solicitacao pendente nao encontrada." });
    }

    await writeAuditLog({
      actorAdminId: currentUserId,
      actorEmail: req.user?.email,
      action: "access_request.reject",
      targetType: "solicitacao_acesso",
      targetId: id,
      req,
    });

    return res.json({ message: "Solicitacao recusada." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao recusar solicitacao de acesso." });
  }
};

exports.alterarSenhaAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const senha = trimToString(req.body?.senha, 255);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Usuario invalido." });
    }

    if (senha.length < 6) {
      return res.status(400).json({ message: "A senha deve ter pelo menos 6 caracteres." });
    }

    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      "UPDATE admins SET senha = ? WHERE id = ?",
      [hash, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [id]);
    await writeAuditLog({
      actorAdminId: req.user?.id,
      actorEmail: req.user?.email,
      action: "admin.password_change",
      targetType: "admin",
      targetId: id,
      req,
    });

    return res.json({ message: "Senha atualizada com sucesso." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao atualizar senha." });
  }
};

exports.alterarStatusAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ativo = Number(req.body?.ativo) ? 1 : 0;
    const currentUserId = Number(req.user?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Usuario invalido." });
    }

    const [rows] = await db.query(
      "SELECT id, ativo, role FROM admins WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const targetUser = rows[0];
    const targetRole = normalizeRole(targetUser.role, "operador");

    if (id === currentUserId && ativo === 0) {
      return res.status(409).json({ message: "Voce nao pode desativar o proprio usuario." });
    }

    if (ativo === 0 && targetRole === "admin" && Number(targetUser.ativo) === 1) {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(409).json({ message: "Nao e possivel desativar o ultimo admin ativo." });
      }
    }

    await db.query("UPDATE admins SET ativo = ? WHERE id = ?", [ativo, id]);

    if (ativo === 0) {
      await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [id]);
    }

    await writeAuditLog({
      actorAdminId: req.user?.id,
      actorEmail: req.user?.email,
      action: ativo ? "admin.activate" : "admin.deactivate",
      targetType: "admin",
      targetId: id,
      details: { role: targetRole },
      req,
    });

    return res.json({ message: ativo ? "Usuario ativado." : "Usuario desativado." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao alterar status do usuario." });
  }
};

exports.alterarRoleAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentUserId = Number(req.user?.id);
    const role = normalizeRole(req.body?.role);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Usuario invalido." });
    }

    if (!role) {
      return res.status(400).json({ message: "Perfil de acesso invalido." });
    }

    const [rows] = await db.query(
      "SELECT id, ativo, role FROM admins WHERE id = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const targetUser = rows[0];
    const previousRole = normalizeRole(targetUser.role, "operador");

    if (id === currentUserId && role !== "admin") {
      return res.status(409).json({ message: "Voce nao pode alterar o proprio perfil de acesso." });
    }

    if (previousRole === "admin" && role !== "admin" && Number(targetUser.ativo) === 1) {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(409).json({ message: "Nao e possivel remover o ultimo admin ativo do sistema." });
      }
    }

    const [result] = await db.query("UPDATE admins SET role = ? WHERE id = ?", [role, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    await writeAuditLog({
      actorAdminId: req.user?.id,
      actorEmail: req.user?.email,
      action: "admin.role_change",
      targetType: "admin",
      targetId: id,
      details: { previousRole, nextRole: role },
      req,
    });

    return res.json({ message: "Perfil de acesso atualizado.", role });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao alterar perfil de acesso." });
  }
};

exports.excluirAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const currentUserId = Number(req.user?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Usuario invalido." });
    }

    if (id === currentUserId) {
      return res.status(409).json({ message: "Voce nao pode excluir o proprio usuario." });
    }

    const [rows] = await db.query("SELECT id, ativo, role FROM admins WHERE id = ? LIMIT 1", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const targetUser = rows[0];
    const targetRole = normalizeRole(targetUser.role, "operador");

    if (targetRole === "admin" && Number(targetUser.ativo) === 1) {
      const activeAdmins = await countActiveAdmins();
      if (activeAdmins <= 1) {
        return res.status(409).json({ message: "Nao e possivel excluir o ultimo usuario do sistema." });
      }
    }

    const [result] = await db.query("DELETE FROM admins WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    await writeAuditLog({
      actorAdminId: req.user?.id,
      actorEmail: req.user?.email,
      action: "admin.delete",
      targetType: "admin",
      targetId: id,
      details: { role: targetRole },
      req,
    });

    return res.json({ message: "Usuario excluido com sucesso." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir usuario." });
  }
};
