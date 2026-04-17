const express = require("express");
const router = express.Router();

const c = require("../controllers/public.controller");

router.post("/agendamentos", c.criarAgendamentoPublico);
router.post("/contatos", c.criarContatoPublico);
router.post("/solicitacoes-acesso", c.criarSolicitacaoAcessoPublica);

module.exports = router;
