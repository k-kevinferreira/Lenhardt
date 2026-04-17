const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const agendamentosController = require("../controllers/agendamentos.controller");

router.use(auth);

router.get("/", agendamentosController.listar);

router.post("/", agendamentosController.criar);

router.put("/:id", agendamentosController.atualizar);

router.delete("/:id", authorize("admin"), agendamentosController.excluir);

router.patch("/:id/confirmar", agendamentosController.confirmar);
router.patch("/:id/cancelar", agendamentosController.cancelar);
router.patch("/:id/reagendar", agendamentosController.reagendar);

router.patch("/:id/concluir", agendamentosController.concluir);

module.exports = router;
