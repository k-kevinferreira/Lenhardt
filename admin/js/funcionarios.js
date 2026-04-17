import { apiFetch, apiLogout, isCurrentUserAdmin, requireAuth } from "./apiClient.js";
import { escapeHtml, textOrDash } from "./htmlSafe.js";

function qs(id) {
  return document.getElementById(id);
}

function badgeStatus(status) {
  const s = String(status || "").toLowerCase();
  const safeStatus = s === "ativo" || s === "inativo" ? s : "";
  return `<span class="badge ${safeStatus}">${textOrDash(safeStatus)}</span>`;
}

function badgeUsuarioAtivo(ativo) {
  return `<span class="badge ${Number(ativo) ? "ativo" : "inativo"}">${Number(ativo) ? "ativo" : "inativo"}</span>`;
}

function badgeUsuarioRole(role) {
  const safeRole = String(role || "").toLowerCase() === "admin" ? "admin" : "operador";
  return `<span class="badge ${safeRole}">${safeRole}</span>`;
}

function badgeSolicitacaoStatus(status) {
  const s = String(status || "").toLowerCase();
  const safeStatus = ["pendente", "aprovado", "recusado"].includes(s) ? s : "";
  return `<span class="badge ${safeStatus}">${textOrDash(safeStatus)}</span>`;
}

function fmtDataHora(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-BR");
}

let cacheFuncionarios = [];
let cacheUsuarios = [];
let cacheSolicitacoesAcesso = [];
let editId = null;
let canDeleteFuncionario = false;

function renderTabela(lista) {
  const tbody = qs("tbodyFuncionarios");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="opacity:.7; padding:16px;">Nenhum funcionario encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((f) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${f.id}</td>
      <td>${textOrDash(f.nome)}</td>
      <td>${textOrDash(f.cargo)}</td>
      <td>${textOrDash(f.email)}</td>
      <td>${textOrDash(f.telefone)}</td>
      <td>${badgeStatus(f.status)}</td>
      <td>${textOrDash(f.observacoes)}</td>
      <td>
        <div class="acoes-inline">
          <button class="btn btn-small btn-editar" data-id="${escapeHtml(f.id)}">Editar</button>
          ${canDeleteFuncionario ? `<button class="btn btn-small btn-ghost btn-excluir" data-id="${escapeHtml(f.id)}">Excluir</button>` : ""}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTabelaUsuarios(lista) {
  const tbody = qs("tbodyUsuarios");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="opacity:.7; padding:16px;">Nenhum usuario encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((u) => {
    const tr = document.createElement("tr");
    const ativo = Number(u.ativo) === 1;
    const role = String(u.role || "operador").toLowerCase() === "admin" ? "admin" : "operador";
    const nextRole = role === "admin" ? "operador" : "admin";

    tr.innerHTML = `
      <td>${escapeHtml(u.id)}</td>
      <td>${textOrDash(u.email)}</td>
      <td>${badgeUsuarioRole(role)}</td>
      <td>${badgeUsuarioAtivo(u.ativo)}</td>
      <td>${escapeHtml(fmtDataHora(u.created_at))}</td>
      <td>
        <div class="acoes-inline">
          <button class="btn btn-small btn-senha-usuario" data-id="${escapeHtml(u.id)}">Senha</button>
          <button class="btn btn-small btn-ghost btn-role-usuario" data-id="${escapeHtml(u.id)}" data-role="${role}">
            Tornar ${nextRole}
          </button>
          <button class="btn btn-small btn-ghost btn-status-usuario" data-id="${escapeHtml(u.id)}" data-ativo="${ativo ? "1" : "0"}">
            ${ativo ? "Desativar" : "Ativar"}
          </button>
          <button class="btn btn-small btn-ghost btn-excluir-usuario" data-id="${escapeHtml(u.id)}">Excluir</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderTabelaSolicitacoes(lista) {
  const tbody = qs("tbodySolicitacoesAcesso");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="opacity:.7; padding:16px;">Nenhuma solicitacao de acesso pendente.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(item.id)}</td>
      <td>${textOrDash(item.nome)}</td>
      <td>${textOrDash(item.email)}</td>
      <td>${textOrDash(item.telefone)}</td>
      <td>${badgeSolicitacaoStatus(item.status)}</td>
      <td>${textOrDash(item.observacoes)}</td>
      <td>${escapeHtml(fmtDataHora(item.created_at))}</td>
      <td>
        <div class="acoes-inline">
          <button class="btn btn-small btn-aprovar-solicitacao" data-id="${escapeHtml(item.id)}">Liberar acesso</button>
          <button class="btn btn-small btn-ghost btn-recusar-solicitacao" data-id="${escapeHtml(item.id)}">Recusar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function aplicarFiltros() {
  const busca = String(qs("buscaFuncionario")?.value || "").trim().toLowerCase();
  const status = String(qs("filtroStatus")?.value || "").trim().toLowerCase();

  let lista = [...cacheFuncionarios];

  if (busca) {
    lista = lista.filter((f) =>
      [f.nome, f.cargo, f.email, f.telefone].join(" ").toLowerCase().includes(busca)
    );
  }

  if (status) {
    lista = lista.filter((f) => String(f.status || "").toLowerCase() === status);
  }

  renderTabela(lista);
}

async function carregarFuncionarios() {
  const data = await apiFetch("/funcionarios");
  cacheFuncionarios = Array.isArray(data) ? data : [];
  aplicarFiltros();
}

async function carregarUsuarios() {
  const data = await apiFetch("/auth/admins");
  cacheUsuarios = Array.isArray(data) ? data : [];
  renderTabelaUsuarios(cacheUsuarios);
}

async function carregarSolicitacoesAcesso() {
  const data = await apiFetch("/auth/access-requests");
  cacheSolicitacoesAcesso = Array.isArray(data) ? data : [];
  renderTabelaSolicitacoes(cacheSolicitacoesAcesso);
}

function aplicarPermissoesNaTela() {
  const isAdmin = isCurrentUserAdmin();
  const usuariosPanel = qs("usuariosPanel");
  const solicitacoesPanel = qs("solicitacoesPanel");
  const btnNovoUsuario = qs("btnNovoUsuario");
  const roleNotice = qs("roleNotice");

  canDeleteFuncionario = isAdmin;

  if (usuariosPanel) usuariosPanel.hidden = !isAdmin;
  if (solicitacoesPanel) solicitacoesPanel.hidden = !isAdmin;
  if (btnNovoUsuario) btnNovoUsuario.hidden = !isAdmin;
  if (roleNotice) roleNotice.hidden = isAdmin;
}

function abrirModal(titulo) {
  qs("modalTitulo").textContent = titulo;
  qs("modalFuncionario")?.classList.add("active");
}

function fecharModal() {
  qs("modalFuncionario")?.classList.remove("active");
  editId = null;
}

function abrirModalUsuario() {
  qs("usuarioEmail").value = "";
  qs("usuarioSenha").value = "";
  qs("usuarioSenhaConfirmacao").value = "";
  qs("usuarioRole").value = "operador";
  qs("modalUsuario")?.classList.add("active");
}

function fecharModalUsuario() {
  qs("modalUsuario")?.classList.remove("active");
}

function abrirModalSenhaUsuario(id) {
  qs("senhaUsuarioId").value = String(id || "");
  qs("novaSenhaUsuario").value = "";
  qs("confirmacaoSenhaUsuario").value = "";
  qs("modalSenhaUsuario")?.classList.add("active");
}

function fecharModalSenhaUsuario() {
  qs("modalSenhaUsuario")?.classList.remove("active");
}

function abrirNovo() {
  editId = null;
  qs("funcionarioId").value = "";
  qs("funcionarioNome").value = "";
  qs("funcionarioCargo").value = "";
  qs("funcionarioEmail").value = "";
  qs("funcionarioTelefone").value = "";
  qs("funcionarioStatus").value = "ativo";
  qs("funcionarioObservacoes").value = "";
  abrirModal("Novo Funcionario");
}

function abrirEdicao(id) {
  const funcionario = cacheFuncionarios.find((item) => String(item.id) === String(id));
  if (!funcionario) return;

  editId = funcionario.id;
  qs("funcionarioId").value = funcionario.id;
  qs("funcionarioNome").value = funcionario.nome || "";
  qs("funcionarioCargo").value = funcionario.cargo || "";
  qs("funcionarioEmail").value = funcionario.email || "";
  qs("funcionarioTelefone").value = funcionario.telefone || "";
  qs("funcionarioStatus").value = funcionario.status || "ativo";
  qs("funcionarioObservacoes").value = funcionario.observacoes || "";
  abrirModal(`Editar Funcionario #${funcionario.id}`);
}

async function salvarFuncionario() {
  const payload = {
    nome: String(qs("funcionarioNome")?.value || "").trim(),
    cargo: String(qs("funcionarioCargo")?.value || "").trim(),
    email: String(qs("funcionarioEmail")?.value || "").trim(),
    telefone: String(qs("funcionarioTelefone")?.value || "").trim(),
    status: String(qs("funcionarioStatus")?.value || "ativo").trim(),
    observacoes: String(qs("funcionarioObservacoes")?.value || "").trim(),
  };

  if (!payload.nome) {
    alert("Informe o nome do funcionario.");
    return;
  }

  if (!payload.cargo) {
    alert("Informe o cargo do funcionario.");
    return;
  }

  if (editId) {
    await apiFetch(`/funcionarios/${editId}`, { method: "PUT", body: payload });
  } else {
    await apiFetch("/funcionarios", { method: "POST", body: payload });
  }

  fecharModal();
  await carregarFuncionarios();
}

async function excluirFuncionario(id) {
  if (!confirm("Deseja excluir este funcionario?")) return;
  await apiFetch(`/funcionarios/${id}`, { method: "DELETE" });
  await carregarFuncionarios();
}

async function salvarUsuario() {
  const email = String(qs("usuarioEmail")?.value || "").trim();
  const senha = String(qs("usuarioSenha")?.value || "");
  const confirmacao = String(qs("usuarioSenhaConfirmacao")?.value || "");
  const role = String(qs("usuarioRole")?.value || "operador").trim().toLowerCase();

  if (!email) {
    alert("Informe o e-mail do usuario.");
    return;
  }

  if (!senha) {
    alert("Informe a senha do usuario.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (senha !== confirmacao) {
    alert("As senhas nao conferem.");
    return;
  }

  await apiFetch("/auth/admins", {
    method: "POST",
    body: { email, senha, role },
  });

  fecharModalUsuario();
  await carregarUsuarios();
  alert("Usuario criado com sucesso.");
}

async function salvarNovaSenhaUsuario() {
  const id = String(qs("senhaUsuarioId")?.value || "");
  const senha = String(qs("novaSenhaUsuario")?.value || "");
  const confirmacao = String(qs("confirmacaoSenhaUsuario")?.value || "");

  if (!id) {
    alert("Usuario invalido.");
    return;
  }

  if (senha.length < 6) {
    alert("A senha deve ter pelo menos 6 caracteres.");
    return;
  }

  if (senha !== confirmacao) {
    alert("As senhas nao conferem.");
    return;
  }

  await apiFetch(`/auth/admins/${id}/password`, {
    method: "PUT",
    body: { senha },
  });

  fecharModalSenhaUsuario();
  alert("Senha atualizada com sucesso.");
}

async function alternarStatusUsuario(id, ativoAtual) {
  await apiFetch(`/auth/admins/${id}/status`, {
    method: "PATCH",
    body: { ativo: ativoAtual ? 0 : 1 },
  });
  await carregarUsuarios();
}

async function alternarRoleUsuario(id, roleAtual) {
  const nextRole = roleAtual === "admin" ? "operador" : "admin";
  await apiFetch(`/auth/admins/${id}/role`, {
    method: "PATCH",
    body: { role: nextRole },
  });
  await carregarUsuarios();
}

async function excluirUsuario(id) {
  if (!confirm("Deseja excluir este usuario do sistema?")) return;
  await apiFetch(`/auth/admins/${id}`, { method: "DELETE" });
  await carregarUsuarios();
}

async function aprovarSolicitacaoAcesso(id) {
  if (!confirm("Deseja liberar o acesso deste usuario?")) return;
  await apiFetch(`/auth/access-requests/${id}/approve`, { method: "PATCH" });
  await Promise.all([carregarUsuarios(), carregarSolicitacoesAcesso()]);
}

async function recusarSolicitacaoAcesso(id) {
  if (!confirm("Deseja recusar esta solicitacao de acesso?")) return;
  await apiFetch(`/auth/access-requests/${id}/reject`, { method: "PATCH" });
  await carregarSolicitacoesAcesso();
}

document.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest(".btn-editar");
  const btnExcluir = e.target.closest(".btn-excluir");
  const btnSenhaUsuario = e.target.closest(".btn-senha-usuario");
  const btnRoleUsuario = e.target.closest(".btn-role-usuario");
  const btnStatusUsuario = e.target.closest(".btn-status-usuario");
  const btnExcluirUsuario = e.target.closest(".btn-excluir-usuario");
  const btnAprovarSolicitacao = e.target.closest(".btn-aprovar-solicitacao");
  const btnRecusarSolicitacao = e.target.closest(".btn-recusar-solicitacao");

  if (btnEditar) {
    abrirEdicao(btnEditar.dataset.id);
    return;
  }

  if (btnExcluir) {
    if (!canDeleteFuncionario) {
      alert("Somente admin pode excluir funcionarios.");
      return;
    }
    try {
      await excluirFuncionario(btnExcluir.dataset.id);
    } catch (err) {
      alert(err.message || "Erro ao excluir funcionario.");
    }
    return;
  }

  if (btnSenhaUsuario) {
    abrirModalSenhaUsuario(btnSenhaUsuario.dataset.id);
    return;
  }

  if (btnRoleUsuario) {
    try {
      await alternarRoleUsuario(btnRoleUsuario.dataset.id, btnRoleUsuario.dataset.role);
    } catch (err) {
      alert(err.message || "Erro ao alterar perfil de acesso.");
    }
    return;
  }

  if (btnStatusUsuario) {
    try {
      await alternarStatusUsuario(
        btnStatusUsuario.dataset.id,
        btnStatusUsuario.dataset.ativo === "1"
      );
    } catch (err) {
      alert(err.message || "Erro ao alterar status do usuario.");
    }
    return;
  }

  if (btnExcluirUsuario) {
    try {
      await excluirUsuario(btnExcluirUsuario.dataset.id);
    } catch (err) {
      alert(err.message || "Erro ao excluir usuario.");
    }
    return;
  }

  if (btnAprovarSolicitacao) {
    try {
      await aprovarSolicitacaoAcesso(btnAprovarSolicitacao.dataset.id);
    } catch (err) {
      alert(err.message || "Erro ao aprovar solicitacao de acesso.");
    }
    return;
  }

  if (btnRecusarSolicitacao) {
    try {
      await recusarSolicitacaoAcesso(btnRecusarSolicitacao.dataset.id);
    } catch (err) {
      alert(err.message || "Erro ao recusar solicitacao de acesso.");
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireAuth();
  if (!ok) return;

  aplicarPermissoesNaTela();

  qs("btnLogout")?.addEventListener("click", async () => {
    try {
      await apiLogout();
    } finally {
      window.location.href = "./login.html";
    }
  });

  qs("btnAtualizar")?.addEventListener("click", () => carregarFuncionarios().catch((e) => alert(e.message)));
  qs("btnNovoUsuario")?.addEventListener("click", abrirModalUsuario);
  qs("btnNovoFuncionario")?.addEventListener("click", abrirNovo);
  qs("salvarFuncionario")?.addEventListener("click", () => salvarFuncionario().catch((e) => alert(e.message)));
  qs("salvarUsuario")?.addEventListener("click", () => salvarUsuario().catch((e) => alert(e.message)));
  qs("salvarSenhaUsuario")?.addEventListener("click", () => salvarNovaSenhaUsuario().catch((e) => alert(e.message)));
  qs("fecharModalFuncionario")?.addEventListener("click", fecharModal);
  qs("cancelarFuncionario")?.addEventListener("click", fecharModal);
  qs("fecharModalUsuario")?.addEventListener("click", fecharModalUsuario);
  qs("cancelarUsuario")?.addEventListener("click", fecharModalUsuario);
  qs("fecharModalSenhaUsuario")?.addEventListener("click", fecharModalSenhaUsuario);
  qs("cancelarSenhaUsuario")?.addEventListener("click", fecharModalSenhaUsuario);
  qs("buscaFuncionario")?.addEventListener("input", aplicarFiltros);
  qs("filtroStatus")?.addEventListener("change", aplicarFiltros);

  qs("modalFuncionario")?.addEventListener("click", (e) => {
    if (e.target.id === "modalFuncionario") fecharModal();
  });

  qs("modalUsuario")?.addEventListener("click", (e) => {
    if (e.target.id === "modalUsuario") fecharModalUsuario();
  });

  qs("modalSenhaUsuario")?.addEventListener("click", (e) => {
    if (e.target.id === "modalSenhaUsuario") fecharModalSenhaUsuario();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharModal();
      fecharModalUsuario();
      fecharModalSenhaUsuario();
    }
  });

  carregarFuncionarios().catch((e) => alert(e.message));

  if (isCurrentUserAdmin()) {
    carregarUsuarios().catch((e) => alert(e.message));
    carregarSolicitacoesAcesso().catch((e) => alert(e.message));
  } else {
    cacheUsuarios = [];
    cacheSolicitacoesAcesso = [];
  }
});
