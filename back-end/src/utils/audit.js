const db = require("../config/db");

function normalizeIp(value) {
  return String(value || "")
    .split(",")[0]
    .trim()
    .slice(0, 64);
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase() === "failure" ? "failure" : "success";
}

async function writeAuditLog({
  actorAdminId = null,
  actorEmail = null,
  action,
  targetType = null,
  targetId = null,
  status = "success",
  details = {},
  req = null,
} = {}) {
  const actionName = String(action || "").trim();
  if (!actionName) return;

  try {
    await db.query(
      `
      INSERT INTO audit_logs
      (actor_admin_id, actor_email, action, target_type, target_id, status, ip, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
      `,
      [
        Number.isInteger(Number(actorAdminId)) && Number(actorAdminId) > 0 ? Number(actorAdminId) : null,
        actorEmail ? String(actorEmail).trim().toLowerCase().slice(0, 160) : null,
        actionName.slice(0, 80),
        targetType ? String(targetType).trim().slice(0, 80) : null,
        Number.isInteger(Number(targetId)) && Number(targetId) > 0 ? Number(targetId) : null,
        normalizeStatus(status),
        normalizeIp(req?.ip) || null,
        req?.headers?.["user-agent"] ? String(req.headers["user-agent"]).slice(0, 1000) : null,
        JSON.stringify(details && typeof details === "object" ? details : {}),
      ]
    );
  } catch (err) {
    console.error("Falha ao gravar audit log:", err.message);
  }
}

module.exports = {
  writeAuditLog,
};
