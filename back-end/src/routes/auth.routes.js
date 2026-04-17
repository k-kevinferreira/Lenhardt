const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const authController = require("../controllers/auth.controller");

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", auth, authController.me);
router.get("/access-requests", auth, authorize("admin"), authController.listarSolicitacoesAcesso);
router.patch("/access-requests/:id/approve", auth, authorize("admin"), authController.aprovarSolicitacaoAcesso);
router.patch("/access-requests/:id/reject", auth, authorize("admin"), authController.recusarSolicitacaoAcesso);
router.get("/admins", auth, authorize("admin"), authController.listarAdmins);
router.post("/admins", auth, authorize("admin"), authController.criarAdmin);
router.put("/admins/:id/password", auth, authorize("admin"), authController.alterarSenhaAdmin);
router.patch("/admins/:id/status", auth, authorize("admin"), authController.alterarStatusAdmin);
router.patch("/admins/:id/role", auth, authorize("admin"), authController.alterarRoleAdmin);
router.delete("/admins/:id", auth, authorize("admin"), authController.excluirAdmin);

module.exports = router;
