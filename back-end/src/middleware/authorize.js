module.exports = function authorize(...roles) {
  const allowed = new Set(
    roles
      .flat()
      .map((role) => String(role || "").trim().toLowerCase())
      .filter(Boolean)
  );

  return function authorizeMiddleware(req, res, next) {
    const role = String(req.user?.role || "").trim().toLowerCase();

    if (allowed.size === 0 || allowed.has(role)) {
      return next();
    }

    return res.status(403).json({ message: "Voce nao tem permissao para esta acao." });
  };
};
