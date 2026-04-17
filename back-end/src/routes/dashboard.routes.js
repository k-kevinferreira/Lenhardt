const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const c = require('../controllers/dashboard.controller');

router.use(auth);

router.get('/resumo', c.resumo);

router.get('/faturamento-mes', c.faturamentoPorMes);

router.get('/servicos-top', c.servicosMaisVendidos);

module.exports = router;
