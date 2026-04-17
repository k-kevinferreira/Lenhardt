// admin/js/veiculos.js
import { apiFetch, apiLogout, isCurrentUserAdmin, requireAuth } from "./apiClient.js";
import { escapeHtml, textOrDash } from "./htmlSafe.js";

function fmtDataISOToBR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function qs(id) {
  return document.getElementById(id);
}

function normalizarPlaca(v) {
  return String(v || "").trim().toUpperCase();
}

let cacheVeiculos = [];
let canDeleteVeiculo = false;

function aplicarBusca() {
  const busca = String(qs("busca")?.value || "").trim().toLowerCase();
  if (!busca) {
    renderTabela(cacheVeiculos);
    return;
  }

  const filtrada = cacheVeiculos.filter((v) => {
    const texto = [
      v.placa,
      v.nome_cliente,
      v.veiculo,
      v.ultimo_servico,
      v.observacao,
    ]
      .join(" ")
      .toLowerCase();

    return texto.includes(busca);
  });

  renderTabela(filtrada);
}

function renderTabela(lista) {
  const tbody = qs("tbodyVeiculos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="opacity:.7; padding:16px;">
          Nenhum veículo encontrado.
        </td>
      </tr>
    `;
    return;
  }

  lista.forEach((v) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(v.id)}</td>
      <td>${textOrDash(v.placa)}</td>
      <td>${textOrDash(v.nome_cliente)}</td>
      <td>${textOrDash(v.veiculo)}</td>
      <td>${textOrDash(v.ultimo_servico)}</td>
      <td>${escapeHtml(fmtDataISOToBR(v.data_ultimo_servico))}</td>
      <td>${textOrDash(v.observacao)}</td>
      <td>
        <div class="acoes-inline">
          <button class="btn btn-small btn-editar" data-id="${escapeHtml(v.id)}">Editar</button>
          ${canDeleteVeiculo ? `<button class="btn btn-small btn-ghost btn-excluir" data-id="${escapeHtml(v.id)}">Excluir</button>` : ""}
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function carregarVeiculos() {
  const data = await apiFetch("/veiculos");
  cacheVeiculos = Array.isArray(data) ? data : [];
  aplicarBusca();
}

function aplicarPermissoesNaTela() {
  canDeleteVeiculo = isCurrentUserAdmin();
  const roleNotice = qs("roleNotice");
  if (roleNotice) roleNotice.hidden = canDeleteVeiculo;
}

async function excluirVeiculo(id) {
  if (!confirm("Deseja excluir este veículo?")) return;
  await apiFetch(`/veiculos/${id}`, { method: "DELETE" });
  await carregarVeiculos();
}

function abrirModalVeiculo(titulo = "Veículo") {
  const overlay = qs("modalVeiculo");
  if (!overlay) return;

  qs("modalTitulo").textContent = titulo;
  overlay.style.display = "flex";
  overlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function fecharModalVeiculo() {
  const overlay = qs("modalVeiculo");
  if (!overlay) return;

  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function validarFormulario() {
  const placa = normalizarPlaca(qs("placa")?.value);
  const nome = String(qs("nome_cliente")?.value || "").trim();
  const veiculo = String(qs("veiculo")?.value || "").trim();

  if (!placa) return "Placa é obrigatória.";
  if (!nome) return "Nome do cliente é obrigatório.";
  if (!veiculo) return "Veículo é obrigatório.";

  return null;
}

function abrirEdicaoVeiculo(id) {
  const veiculo = cacheVeiculos.find((v) => String(v.id) === String(id));
  if (!veiculo) return;

  qs("veiculoId").value = veiculo.id ?? "";
  qs("placa").value = veiculo.placa || "";
  qs("nome_cliente").value = veiculo.nome_cliente || "";
  qs("veiculo").value = veiculo.veiculo || "";
  qs("ultimo_servico").value = veiculo.ultimo_servico || "";
  qs("data_ultimo_servico").value = veiculo.data_ultimo_servico
    ? String(veiculo.data_ultimo_servico).slice(0, 10)
    : "";
  qs("observacao").value = veiculo.observacao || "";

  abrirModalVeiculo("Editar Veículo");
}

async function salvarEdicaoVeiculo() {
  const msg = validarFormulario();
  if (msg) {
    alert(msg);
    return;
  }

  const id = String(qs("veiculoId")?.value || "");
  if (!id) {
    alert("ID do veículo não encontrado para salvar.");
    return;
  }

  const payload = {
    placa: normalizarPlaca(qs("placa").value),
    nome_cliente: String(qs("nome_cliente").value || "").trim(),
    veiculo: String(qs("veiculo").value || "").trim(),
    ultimo_servico: String(qs("ultimo_servico").value || "").trim(),
    data_ultimo_servico: qs("data_ultimo_servico").value || null,
    observacao: String(qs("observacao").value || "").trim(),
  };

  await apiFetch(`/veiculos/${id}`, {
    method: "PUT",
    body: payload,
  });

  fecharModalVeiculo();
  await carregarVeiculos();
}

function clicarForaParaFecharModal(e) {
  const overlay = qs("modalVeiculo");
  if (!overlay) return;
  if (e.target === overlay) fecharModalVeiculo();
}

function escParaFecharModal(e) {
  if (e.key !== "Escape") return;
  fecharModalVeiculo();
}

document.addEventListener("click", async (e) => {
  const btnExcluir = e.target.closest(".btn-excluir");
  const btnEditar = e.target.closest(".btn-editar");

  if (btnExcluir) {
    if (!canDeleteVeiculo) {
      alert("Somente admin pode excluir veiculos.");
      return;
    }
    try {
      await excluirVeiculo(btnExcluir.dataset.id);
    } catch (err) {
      alert(err.message);
    }
    return;
  }

  if (btnEditar) {
    abrirEdicaoVeiculo(btnEditar.dataset.id);
    return;
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireAuth();
  if (!ok) return;
  aplicarPermissoesNaTela();

  const btnLogout = qs("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await apiLogout();
      } finally {
        window.location.href = "./login.html";
      }
    });
  }

  const btnAtualizar = qs("btnAtualizar");
  if (btnAtualizar) {
    btnAtualizar.addEventListener("click", () =>
      carregarVeiculos().catch((e) => alert(e.message))
    );
  }

  qs("busca")?.addEventListener("input", aplicarBusca);

  const btnSalvar = qs("salvarVeiculo");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", async () => {
      try {
        await salvarEdicaoVeiculo();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  qs("fecharModalVeiculo")?.addEventListener("click", fecharModalVeiculo);
  qs("cancelarVeiculo")?.addEventListener("click", fecharModalVeiculo);

  const overlay = qs("modalVeiculo");
  if (overlay) overlay.addEventListener("click", clicarForaParaFecharModal);

  document.addEventListener("keydown", escParaFecharModal);

  carregarVeiculos().catch((e) => alert(e.message));
});
