const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const c = require('../controllers/veiculos.controller');

router.use(auth);

router.get('/', c.listar);
router.get('/:id/historico', c.historico); 
router.post('/', c.criar);
router.put('/:id', c.atualizar);
router.delete('/:id', authorize('admin'), c.excluir);

module.exports = router;
