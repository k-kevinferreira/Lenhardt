import { apiLogin, apiPublicPost } from "./apiClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-login");
  const emailInput = document.getElementById("email");
  const senhaInput = document.getElementById("senha");
  const errorEl = document.getElementById("loginError");
  const btn = document.getElementById("loginSubmit");
  const toggleSenha = document.getElementById("toggleSenha");
  const requestAccessBtn = document.getElementById("requestAccessBtn");
  const requestAccessModal = document.getElementById("requestAccessModal");
  const requestAccessForm = document.getElementById("requestAccessForm");
  const requestAccessError = document.getElementById("requestAccessError");
  const closeRequestAccessModal = document.getElementById("closeRequestAccessModal");
  const cancelRequestAccess = document.getElementById("cancelRequestAccess");
  const requestAccessSubmit = document.getElementById("requestAccessSubmit");

  if (!form) return;

  function setError(message = "") {
    if (errorEl) errorEl.textContent = message;
  }

  function setRequestAccessError(message = "") {
    if (requestAccessError) requestAccessError.textContent = message;
  }

  function openRequestAccessModal() {
    requestAccessForm?.reset();
    setRequestAccessError("");
    requestAccessModal?.classList.add("active");
  }

  function closeRequestModal() {
    requestAccessModal?.classList.remove("active");
  }

  toggleSenha?.addEventListener("click", () => {
    if (!senhaInput) return;

    const aberta = senhaInput.type === "text";
    senhaInput.type = aberta ? "password" : "text";
    toggleSenha.innerHTML = aberta
      ? '<i class="fa-regular fa-eye"></i>'
      : '<i class="fa-regular fa-eye-slash"></i>';
  });

  requestAccessBtn?.addEventListener("click", openRequestAccessModal);
  closeRequestAccessModal?.addEventListener("click", closeRequestModal);
  cancelRequestAccess?.addEventListener("click", closeRequestModal);
  requestAccessModal?.addEventListener("click", (e) => {
    if (e.target === requestAccessModal) closeRequestModal();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailInput?.value || "").trim();
    const senha = senhaInput?.value || "";

    if (!email || !senha) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setError("");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Entrando...";
    }

    try {
      await apiLogin(email, senha);
      window.location.href = "./dashboard.html";
    } catch (err) {
      console.error("ERRO NO LOGIN:", err);
      setError(err.message || "Erro no login.");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Entrar no painel";
      }
    }
  });

  requestAccessForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = (document.getElementById("requestNome")?.value || "").trim();
    const email = (document.getElementById("requestEmail")?.value || "").trim();
    const telefone = (document.getElementById("requestTelefone")?.value || "").trim();
    const senha = document.getElementById("requestSenha")?.value || "";
    const confirmacao = document.getElementById("requestSenhaConfirmacao")?.value || "";
    const observacoes = (document.getElementById("requestObservacoes")?.value || "").trim();

    if (!nome || !email || !senha) {
      setRequestAccessError("Preencha nome, e-mail e senha.");
      return;
    }

    if (senha.length < 6) {
      setRequestAccessError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmacao) {
      setRequestAccessError("As senhas não conferem.");
      return;
    }

    setRequestAccessError("");

    if (requestAccessSubmit) {
      requestAccessSubmit.disabled = true;
      requestAccessSubmit.textContent = "Enviando...";
    }

    try {
      await apiPublicPost("/public/solicitacoes-acesso", {
        nome,
        email,
        telefone,
        senha,
        observacoes,
      });
      alert("Solicitação enviada com sucesso. Aguarde a liberação de um administrador.");
      closeRequestModal();
    } catch (err) {
      console.error("ERRO NA SOLICITAÇÃO DE ACESSO:", err);
      setRequestAccessError(err.message || "Não foi possível enviar a solicitação.");
    } finally {
      if (requestAccessSubmit) {
        requestAccessSubmit.disabled = false;
        requestAccessSubmit.textContent = "Enviar solicitação";
      }
    }
  });
});
