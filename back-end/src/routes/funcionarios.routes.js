const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const c = require("../controllers/funcionarios.controller");

router.use(auth);

router.get("/", c.listar);
router.post("/", c.criar);
router.put("/:id", c.atualizar);
router.delete("/:id", authorize("admin"), c.excluir);

module.exports = router;
