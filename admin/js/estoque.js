import { apiFetch, apiLogout, isCurrentUserAdmin, requireAuth } from "./apiClient.js";
import { escapeHtml, textOrDash } from "./htmlSafe.js";

function fmtBRL(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDataISOToBR(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function badgeStatus(status) {
  const s = String(status || "").toLowerCase();
  const map = {
    ok: "ok",
    baixo: "baixo",
    sem_estoque: "sem estoque",
  };
  const safeStatus = Object.hasOwn(map, s) ? s : "";
  return `<span class="badge ${safeStatus}">${textOrDash(map[safeStatus])}</span>`;
}

function statusFromQuantidade(qtd) {
  const q = Number(qtd);
  if (q <= 0) return "sem_estoque";
  if (q <= 5) return "baixo";
  return "ok";
}

function atualizarStatusPreview() {
  const qtdEl = document.getElementById("produtoQtd");
  const sel = document.getElementById("produtoStatus");
  if (!qtdEl || !sel) return;
  const qtd = Number(qtdEl.value);
  sel.value = statusFromQuantidade(qtd);
}

let cacheProdutos = [];
let editId = null;
let canDeleteProduto = false;

function renderTabela(lista) {
  const tbody = document.getElementById("tbodyProdutos");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="opacity:.7; padding:16px;">Nenhum produto encontrado.</td>
      </tr>
    `;
    return;
  }

  lista.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(p.id)}</td>
      <td>${textOrDash(p.produto)}</td>
      <td>${escapeHtml(p.quantidade)}</td>
      <td>${escapeHtml(fmtDataISOToBR(p.data_compra))}</td>
      <td>${escapeHtml(fmtBRL(p.valor_gasto))}</td>
      <td>${badgeStatus(p.status)}</td>
      <td>
        <div class="acoes-inline">
          <button class="btn btn-small btn-editar" data-id="${escapeHtml(p.id)}">Editar</button>
          ${canDeleteProduto ? `<button class="btn btn-small btn-ghost btn-excluir" data-id="${escapeHtml(p.id)}">Excluir</button>` : ""}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function aplicarPermissoesNaTela() {
  canDeleteProduto = isCurrentUserAdmin();
  const roleNotice = document.getElementById("roleNotice");
  if (roleNotice) roleNotice.hidden = canDeleteProduto;
}

function aplicarFiltros() {
  const buscaEl = document.getElementById("buscaProduto");
  const filtroEl = document.getElementById("filtroStatus");

  const q = (buscaEl?.value || "").trim().toLowerCase();
  const st = (filtroEl?.value || "").trim().toLowerCase();

  let lista = [...cacheProdutos];

  if (q) lista = lista.filter((p) => String(p.produto || "").toLowerCase().includes(q));
  if (st) lista = lista.filter((p) => String(p.status || "").toLowerCase() === st);

  renderTabela(lista);
}

async function carregarProdutos() {
  const dados = await apiFetch("/produtos");
  cacheProdutos = Array.isArray(dados) ? dados : [];
  aplicarFiltros();
}

function abrirModalNovo() {
  editId = null;

  const modalTitulo = document.getElementById("modalTitulo");
  const produtoId = document.getElementById("produtoId");
  const produtoNome = document.getElementById("produtoNome");
  const produtoQtd = document.getElementById("produtoQtd");
  const produtoDataCompra = document.getElementById("produtoDataCompra");
  const produtoValorGasto = document.getElementById("produtoValorGasto");
  const produtoStatus = document.getElementById("produtoStatus");
  const modalProduto = document.getElementById("modalProduto");

  if (modalTitulo) modalTitulo.textContent = "Novo Produto";
  if (produtoId) produtoId.value = "";
  if (produtoNome) produtoNome.value = "";
  if (produtoQtd) produtoQtd.value = "0";
  if (produtoDataCompra) produtoDataCompra.value = "";
  if (produtoValorGasto) produtoValorGasto.value = "0";
  if (produtoStatus) produtoStatus.value = "sem_estoque";
  if (modalProduto) modalProduto.classList.add("active");

  atualizarStatusPreview();
}

function abrirModalEditar(id) {
  const p = cacheProdutos.find((x) => String(x.id) === String(id));
  if (!p) return;

  editId = p.id;

  const modalTitulo = document.getElementById("modalTitulo");
  const produtoId = document.getElementById("produtoId");
  const produtoNome = document.getElementById("produtoNome");
  const produtoQtd = document.getElementById("produtoQtd");
  const produtoDataCompra = document.getElementById("produtoDataCompra");
  const produtoValorGasto = document.getElementById("produtoValorGasto");
  const modalProduto = document.getElementById("modalProduto");

  if (modalTitulo) modalTitulo.textContent = `Editar Produto #${p.id}`;
  if (produtoId) produtoId.value = p.id;
  if (produtoNome) produtoNome.value = p.produto || "";
  if (produtoQtd) produtoQtd.value = String(p.quantidade ?? 0);

  if (produtoDataCompra) {
    if (p.data_compra) {
      const d = new Date(p.data_compra);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      produtoDataCompra.value = `${yyyy}-${mm}-${dd}`;
    } else {
      produtoDataCompra.value = "";
    }
  }

  if (produtoValorGasto) produtoValorGasto.value = String(p.valor_gasto ?? 0);
  if (modalProduto) modalProduto.classList.add("active");

  atualizarStatusPreview();
}

function fecharModalProduto() {
  const modalProduto = document.getElementById("modalProduto");
  if (modalProduto) modalProduto.classList.remove("active");
  editId = null;
}

async function salvarProduto() {
  try {
    const produtoEl = document.getElementById("produtoNome");
    const qtdEl = document.getElementById("produtoQtd");
    const dataEl = document.getElementById("produtoDataCompra");
    const valorEl = document.getElementById("produtoValorGasto");

    const produto = (produtoEl?.value || "").trim();
    const quantidade = Number(qtdEl?.value);
    const data_compra = dataEl?.value || null;
    const valor_gasto = Number(valorEl?.value);

    if (!produto) return alert("Informe o nome do produto.");
    if (!Number.isFinite(quantidade) || quantidade < 0) return alert("Quantidade inválida.");
    if (!Number.isFinite(valor_gasto) || valor_gasto < 0) return alert("Valor gasto inválido.");

    const payload = { produto, quantidade, data_compra, valor_gasto };

    if (editId) {
      await apiFetch(`/produtos/${editId}`, { method: "PUT", body: payload });
    } else {
      await apiFetch("/produtos", { method: "POST", body: payload });
    }

    const buscaEl = document.getElementById("buscaProduto");
    const filtroEl = document.getElementById("filtroStatus");
    if (buscaEl) buscaEl.value = "";
    if (filtroEl) filtroEl.value = "";

    fecharModalProduto();
    await carregarProdutos();
  } catch (err) {
    alert(err.message || "Erro ao salvar produto.");
    console.error(err);
  }
}

document.addEventListener("click", async (e) => {
  const btnEditar = e.target.closest(".btn-editar");
  const btnExcluir = e.target.closest(".btn-excluir");

  if (btnEditar) abrirModalEditar(btnEditar.dataset.id);

  if (btnExcluir) {
    if (!canDeleteProduto) {
      alert("Somente admins podem excluir produtos.");
      return;
    }
    try {
      const id = btnExcluir.dataset.id;
      if (!confirm("Deseja excluir este produto?")) return;
      await apiFetch(`/produtos/${id}`, { method: "DELETE" });
      await carregarProdutos();
    } catch (err) {
      alert(err.message || "Erro ao excluir produto.");
    }
  }
});

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
  if (btnAtualizar) btnAtualizar.addEventListener("click", () => carregarProdutos().catch((e) => alert(e.message)));

  const btnNovoProduto = document.getElementById("btnNovoProduto");
  if (btnNovoProduto) btnNovoProduto.addEventListener("click", abrirModalNovo);

  const btnSalvar = document.getElementById("salvarProduto");
  if (btnSalvar) btnSalvar.addEventListener("click", () => salvarProduto().catch((e) => alert(e.message)));

  const btnFechar = document.getElementById("fecharModalProduto");
  if (btnFechar) btnFechar.addEventListener("click", fecharModalProduto);

  const btnCancelar = document.getElementById("cancelarModalProduto");
  if (btnCancelar) btnCancelar.addEventListener("click", fecharModalProduto);

  const modal = document.getElementById("modalProduto");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target.id === "modalProduto") fecharModalProduto();
    });
  }

  const buscaEl = document.getElementById("buscaProduto");
  if (buscaEl) buscaEl.addEventListener("input", aplicarFiltros);

  const filtroEl = document.getElementById("filtroStatus");
  if (filtroEl) filtroEl.addEventListener("change", aplicarFiltros);

  const qtdEl = document.getElementById("produtoQtd");
  if (qtdEl) qtdEl.addEventListener("input", atualizarStatusPreview);

  carregarProdutos().catch((e) => alert(e.message));
});
