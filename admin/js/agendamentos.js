import { apiFetch, apiLogout, isCurrentUserAdmin, requireAuth } from "./apiClient.js";
import { escapeAttr, escapeHtml, textOrDash } from "./htmlSafe.js";

// -------- FORMATADORES E STATUS --------
function fmtDataISOToBR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function fmtBRL(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normStatus(status) {
  const s = String(status || "").trim().toLowerCase();
  return s ? s : "pendente";
}

function badgeStatus(status) {
  const s = normStatus(status);
  const safeStatus = ["pendente", "confirmado", "cancelado", "reagendado", "concluido"].includes(s)
    ? s
    : "pendente";
  return `<span class="badge ${safeStatus}">${textOrDash(safeStatus)}</span>`;
}

function opcoesPorStatus(statusRaw) {
  const st = normStatus(statusRaw);
  if (st === "concluido") return ["excluir"];
  if (st === "cancelado") return ["reagendar", "excluir"];
  return ["confirmar", "reagendar", "cancelar", "concluir", "excluir"];
}

let cacheVeiculos = [];
let reagendarId = null;
let canDeleteAgendamento = false;

// -------- VEICULOS AUXILIARES --------
async function carregarVeiculosParaSelect() {
  const select = document.getElementById("novoVeiculoId");
  if (!select) return;

  select.innerHTML = `<option value="">Carregando veículos...</option>`;

  const veiculos = await apiFetch("/veiculos");
  cacheVeiculos = Array.isArray(veiculos) ? veiculos : [];

  if (!cacheVeiculos.length) {
    select.innerHTML = `<option value="">Nenhum veículo cadastrado</option>`;
    return;
  }

  select.innerHTML = `<option value="">Selecione um veículo</option>`;

  cacheVeiculos.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = `${v.placa || "-"} • ${v.nome_cliente || "-"} • ${v.veiculo || "-"}`;
    select.appendChild(opt);
  });
}

// -------- TABELA E LISTAGEM --------
function renderTabela(lista) {
  const tbody = document.getElementById("tbodyAgendamentos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="opacity:.7; padding: 16px;">
          Nenhum agendamento encontrado.
        </td>
      </tr>
    `;
    return;
  }

  lista.forEach((a) => {
    const tr = document.createElement("tr");

    const ops = opcoesPorStatus(a.status).filter((op) => canDeleteAgendamento || op !== "excluir");
    const actionsDisabled = ops.length === 0;
    const optionsHtml = `
      <option value="">Ação</option>
      ${ops.includes("confirmar") ? `<option value="confirmar">Confirmar</option>` : ""}
      ${ops.includes("reagendar") ? `<option value="reagendar">Reagendar</option>` : ""}
      ${ops.includes("cancelar") ? `<option value="cancelar">Cancelar</option>` : ""}
      ${ops.includes("concluir") ? `<option value="concluir">Concluir</option>` : ""}
      ${ops.includes("excluir") ? `<option value="excluir">Excluir</option>` : ""}
    `;

    tr.innerHTML = `
        <td>${escapeHtml(a.id)}</td>
  <td>${textOrDash(a.nome)}</td>
  <td>${textOrDash(a.telefone)}</td>
  <td>${textOrDash(a.servico)}</td>
  <td>${escapeHtml(fmtBRL(a.valor))}</td>
  <td>${escapeHtml(fmtDataISOToBR(a.data))}</td>
  <td>${textOrDash(a.observacoes)}</td>
  <td>${badgeStatus(a.status)}</td>
      <td>
        <div class="acoes-inline">
          <select class="input acao-select" data-id="${escapeAttr(a.id)}" ${actionsDisabled ? "disabled" : ""}>
            ${optionsHtml}
          </select>

          <button
            class="btn btn-small executar-acao"
            data-id="${escapeAttr(a.id)}"
            data-nome="${escapeAttr(a.nome || "")}"
            data-data="${escapeAttr(a.data || "")}"
            ${actionsDisabled ? "disabled" : ""}
          >
            OK
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function aplicarPermissoesNaTela() {
  canDeleteAgendamento = isCurrentUserAdmin();
  const roleNotice = document.getElementById("roleNotice");
  if (roleNotice) roleNotice.hidden = canDeleteAgendamento;
}

async function carregarAgendamentos() {
  const filtroEl = document.getElementById("filtroStatus");
  const status = (filtroEl?.value || "").trim().toLowerCase();

  const lista = await apiFetch("/agendamentos");
  const arr = Array.isArray(lista) ? lista : [];

  const filtrada = status ? arr.filter((x) => normStatus(x.status) === status) : arr;
  renderTabela(filtrada);
}

// -------- MODAL REAGENDAR --------
function abrirModalReagendar({ id, nome, data }) {
  reagendarId = Number(id);

  const info = document.getElementById("reagendarInfo");
  if (info) info.textContent = `Agendamento #${id} • ${nome || ""}`;

  const input = document.getElementById("novaData");
  if (input) {
    if (data) {
      const d = new Date(data);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      input.value = `${yyyy}-${mm}-${dd}`;
    } else {
      input.value = "";
    }
  }

  const modal = document.getElementById("modalReagendar");
  if (modal) modal.classList.add("active");
}

function fecharModalReagendar() {
  const modal = document.getElementById("modalReagendar");
  if (modal) modal.classList.remove("active");
  reagendarId = null;
}

async function confirmarReagendar() {
  const input = document.getElementById("novaData");
  const novaData = input?.value || "";

  if (!reagendarId) return;

  if (!novaData) {
    alert("Informe a nova data.");
    return;
  }

  await apiFetch(`/agendamentos/${reagendarId}/reagendar`, {
    method: "PATCH",
    body: { data: novaData },
  });

  fecharModalReagendar();
  await carregarAgendamentos();
}

// -------- MODAL NOVO AGENDAMENTO --------
async function abrirModalNovo() {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };

  setVal("novoNome", "");
  setVal("novoEmail", "");
  setVal("novoTelefone", "");
  setVal("novoServico", "");
  setVal("novoValor", "");
  setVal("novoData", "");
  setVal("novoObs", "");

  await carregarVeiculosParaSelect();

  const modal = document.getElementById("modalNovoAgendamento");
  if (modal) modal.classList.add("active");
}

function fecharModalNovo() {
  const modal = document.getElementById("modalNovoAgendamento");
  if (modal) modal.classList.remove("active");
}

async function salvarNovoAgendamento() {
  const getVal = (id) => (document.getElementById(id)?.value || "").trim();

  const nome = getVal("novoNome");
  const email = getVal("novoEmail");
  const telefone = getVal("novoTelefone");
  const servico = getVal("novoServico");
  const observacoes = getVal("novoObs");

  const veiculo_id = Number(document.getElementById("novoVeiculoId")?.value);
  const valor = Number(document.getElementById("novoValor")?.value);
  const data = document.getElementById("novoData")?.value || "";

  if (!nome || !telefone || !servico || !data || !Number.isFinite(valor) || valor <= 0) {
    alert("Preencha: Nome, Telefone, Serviço, Valor e Data.");
    return;
  }

  if (!Number.isFinite(veiculo_id) || veiculo_id <= 0) {
    alert("Selecione um veículo.");
    return;
  }

  await apiFetch("/agendamentos", {
    method: "POST",
    body: { nome, email, telefone, veiculo_id, servico, valor, data, observacoes },
  });

  fecharModalNovo();
  await carregarAgendamentos();
}

// -------- MODAL NOVO VEICULO --------
function abrirModalNovoVeiculo() {
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v;
  };

  setVal("vPlaca", "");
  setVal("vNomeCliente", "");
  setVal("vVeiculo", "");

  const modal = document.getElementById("modalNovoVeiculo");
  if (modal) modal.classList.add("active");
}

function fecharModalNovoVeiculo() {
  const modal = document.getElementById("modalNovoVeiculo");
  if (modal) modal.classList.remove("active");
}

async function salvarNovoVeiculo() {
  const placa = (document.getElementById("vPlaca")?.value || "").trim();
  const nome_cliente = (document.getElementById("vNomeCliente")?.value || "").trim();
  const veiculo = (document.getElementById("vVeiculo")?.value || "").trim();

  if (!placa || !nome_cliente || !veiculo) {
    alert("Preencha: Placa, Nome do cliente e Veículo.");
    return;
  }

  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  const data_ultimo_servico = `${yyyy}-${mm}-${dd}`;

  const resp = await apiFetch("/veiculos", {
    method: "POST",
    body: {
      placa,
      nome_cliente,
      veiculo,
      // Compatibilidade com bancos ainda não migrados, onde esses campos podem seguir obrigatórios.
      ultimo_servico: "Cadastro inicial",
      data_ultimo_servico,
      observacao: "Ficha criada via modal de agendamentos",
    },
  });

  const novoId = resp?.id;

  await carregarVeiculosParaSelect();

  if (novoId) {
    const select = document.getElementById("novoVeiculoId");
    if (select) select.value = String(novoId);
  }

  fecharModalNovoVeiculo();
}

// -------- ACOES DA TABELA --------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".executar-acao");
  if (!btn) return;

  const id = btn.dataset.id;
  const select = document.querySelector(`.acao-select[data-id="${id}"]`);
  const acao = select?.value;

  if (!acao) {
    alert("Selecione uma ação.");
    return;
  }

  btn.disabled = true;

  try {
    if (acao === "confirmar") {
      await apiFetch(`/agendamentos/${id}/confirmar`, { method: "PATCH" });
    } else if (acao === "cancelar") {
      if (!confirm("Deseja cancelar este agendamento?")) return;
      await apiFetch(`/agendamentos/${id}/cancelar`, { method: "PATCH" });
    } else if (acao === "excluir") {
      if (!confirm("Deseja excluir este agendamento?")) return;
      await apiFetch(`/agendamentos/${id}`, { method: "DELETE" });
    } else if (acao === "reagendar") {
      abrirModalReagendar({
        id,
        nome: btn.dataset.nome || "",
        data: btn.dataset.data || "",
      });
      return;
    } else if (acao === "concluir") {
      const ok = confirm("Deseja concluir este agendamento e registrar o pagamento?");
      if (!ok) return;

      await apiFetch(`/agendamentos/${id}/concluir`, {
        method: "PATCH",
        body: { status: "pago" },
      });
    }

    await carregarAgendamentos();
  } catch (err) {
    alert(err.message);
  } finally {
    if (select) select.value = "";
    btn.disabled = false;
  }
});

// -------- INICIALIZACAO --------
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireAuth();
  if (!ok) return;
  aplicarPermissoesNaTela();

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await apiLogout();
      } finally {
        window.location.href = "./login.html";
      }
    });
  }

  const btnAtualizar = document.getElementById("btnAtualizar");
  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", () =>
      carregarAgendamentos().catch((e) => alert(e.message))
    );
  }

  const filtroStatus = document.getElementById("filtroStatus");
  if (filtroStatus) {
    filtroStatus.addEventListener("change", () =>
      carregarAgendamentos().catch((e) => alert(e.message))
    );
  }

  const btnNovoAgendamento = document.getElementById("btnNovoAgendamento");
  if (btnNovoAgendamento) {
    btnNovoAgendamento.addEventListener("click", () =>
      abrirModalNovo().catch((e) => alert(e.message))
    );
  }

  const fecharNovo = document.getElementById("fecharModalNovo");
  if (fecharNovo) fecharNovo.addEventListener("click", fecharModalNovo);

  const cancelarNovo = document.getElementById("cancelarNovo");
  if (cancelarNovo) cancelarNovo.addEventListener("click", fecharModalNovo);

  const salvarNovo = document.getElementById("salvarNovo");
  if (salvarNovo) {
    salvarNovo.addEventListener("click", () =>
      salvarNovoAgendamento().catch((e) => alert(e.message))
    );
  }

  const modalNovo = document.getElementById("modalNovoAgendamento");
  if (modalNovo) {
    modalNovo.addEventListener("click", (e) => {
      if (e.target.id === "modalNovoAgendamento") fecharModalNovo();
    });
  }

  const fecharReag = document.getElementById("fecharModalReagendar");
  if (fecharReag) fecharReag.addEventListener("click", fecharModalReagendar);

  const cancelarReag = document.getElementById("cancelarReagendar");
  if (cancelarReag) cancelarReag.addEventListener("click", fecharModalReagendar);

  const confirmarReag = document.getElementById("confirmarReagendar");
  if (confirmarReag) {
    confirmarReag.addEventListener("click", () =>
      confirmarReagendar().catch((e) => alert(e.message))
    );
  }

  const modalReag = document.getElementById("modalReagendar");
  if (modalReag) {
    modalReag.addEventListener("click", (e) => {
      if (e.target.id === "modalReagendar") fecharModalReagendar();
    });
  }

  const btnAbrirNovoVeiculo = document.getElementById("btnAbrirNovoVeiculo");
  if (btnAbrirNovoVeiculo) btnAbrirNovoVeiculo.addEventListener("click", abrirModalNovoVeiculo);

  const fecharNV = document.getElementById("fecharModalNovoVeiculo");
  if (fecharNV) fecharNV.addEventListener("click", fecharModalNovoVeiculo);

  const cancelarNV = document.getElementById("cancelarNovoVeiculo");
  if (cancelarNV) cancelarNV.addEventListener("click", fecharModalNovoVeiculo);

  const salvarNV = document.getElementById("salvarNovoVeiculo");
  if (salvarNV) {
    salvarNV.addEventListener("click", () =>
      salvarNovoVeiculo().catch((e) => alert(e.message))
    );
  }

  const modalNV = document.getElementById("modalNovoVeiculo");
  if (modalNV) {
    modalNV.addEventListener("click", (e) => {
      if (e.target.id === "modalNovoVeiculo") fecharModalNovoVeiculo();
    });
  }

  carregarAgendamentos().catch((e) => alert(e.message));
});
