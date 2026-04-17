// -------- DEPENDENCIAS --------
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const publicRoutes = require("./routes/public.routes");
const funcionariosRoutes = require("./routes/funcionarios.routes");
const produtosRoutes = require("./routes/produtos.routes");
const agendamentosRoutes = require("./routes/agendamentos.routes");
const veiculosRoutes = require("./routes/veiculos.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

// -------- APP --------
const app = express();

app.set("trust proxy", 1);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (req, res) => res.statusCode < 400,
  message: { message: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

const publicFormsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Muitas tentativas enviadas. Aguarde alguns minutos e tente novamente." },
});

// -------- MIDDLEWARES GLOBAIS --------
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

// -------- HEALTHCHECK --------
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.locals.loginLimiter = loginLimiter;

// -------- RATE LIMIT POR ROTA --------
app.use("/api/auth/login", loginLimiter);
app.use("/api/public/agendamentos", publicFormsLimiter);
app.use("/api/public/contatos", publicFormsLimiter);

// -------- ROTAS --------
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/funcionarios", funcionariosRoutes);
app.use("/api/produtos", produtosRoutes);
app.use("/api/agendamentos", agendamentosRoutes);
app.use("/api/veiculos", veiculosRoutes);
app.use("/api/dashboard", dashboardRoutes);

// -------- TRATAMENTO DE ERROS --------
app.use((err, req, res, next) => {
  if (err && err.message && String(err.message).toLowerCase().includes("cors")) {
    return res.status(403).json({ message: "CORS bloqueado para esta origem" });
  }
  console.error(err);
  return res.status(500).json({ message: "Erro interno do servidor" });
});

// -------- START DO SERVIDOR --------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
