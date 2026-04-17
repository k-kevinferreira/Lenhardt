import { apiFetch, apiLogout, requireAuth } from "./apiClient.js";

// -------- FORMATADORES --------
function brl(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function mesNome(m) {
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return nomes[m - 1] || String(m);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// -------- FILTROS --------
function preencherFiltros() {
  const anoEl = document.getElementById("filtroAno");
  const mesEl = document.getElementById("filtroMes");

  const now = new Date();
  const anoAtual = now.getFullYear();
  const mesAtual = now.getMonth() + 1;

  if (anoEl && anoEl.options.length === 0) {
    for (let a = anoAtual; a >= anoAtual - 5; a--) {
      const opt = document.createElement("option");
      opt.value = String(a);
      opt.textContent = String(a);
      anoEl.appendChild(opt);
    }
    anoEl.value = String(anoAtual);
  }

  if (mesEl && mesEl.options.length === 0) {
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = mesNome(m);
      mesEl.appendChild(opt);
    }
    mesEl.value = String(mesAtual);
  }
}

async function carregarResumo(ano, mes) {
  return apiFetch(`/dashboard/resumo?ano=${encodeURIComponent(ano)}&mes=${encodeURIComponent(mes)}`);
}

async function carregarFaturamentoPorMes(ano) {
  return apiFetch(`/dashboard/faturamento-mes?ano=${encodeURIComponent(ano)}`);
}

async function carregarServicosTop(ano, mes) {
  return apiFetch(`/dashboard/servicos-top?ano=${encodeURIComponent(ano)}&mes=${encodeURIComponent(mes)}`);
}

let chartBar = null;
let chartDonut = null;

// -------- GRÁFICOS --------
function renderBar({ data } = {}) {
  const el = document.getElementById("chartBar");
  if (!el) return;

  if (typeof ApexCharts === "undefined") {
    console.warn("ApexCharts não carregou. Verifique o <script src=...> no HTML.");
    return;
  }

  const arr = Array.isArray(data) ? data : [];
  const categorias = arr.map((x) => mesNome(Number(x.mes)));
  const valores = arr.map((x) => Number(x.total || 0));

  const options = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    series: [{ name: "Faturamento", data: valores }],
    xaxis: { categories: categorias },
    yaxis: { labels: { formatter: (v) => brl(v) } },
    tooltip: { y: { formatter: (v) => brl(v) } },
  };

  if (chartBar) return chartBar.updateOptions(options, true, true);

  el.innerHTML = "";
  chartBar = new ApexCharts(el, options);
  chartBar.render();
}

function renderDonut({ data } = {}) {
  const el = document.getElementById("chartDonut");
  if (!el) return;

  if (typeof ApexCharts === "undefined") {
    console.warn("ApexCharts não carregou. Verifique o <script src=...> no HTML.");
    return;
  }

  const arr = Array.isArray(data) ? data : [];
  const labels = arr.map((x) => x.servico || "—");
  const series = arr.map((x) => Number(x.total || x.qtd || 0));

  const options = {
    chart: { type: "donut", height: 280 },
    labels,
    series,
    tooltip: { y: { formatter: (v) => String(v) } },
    legend: { position: "bottom" },
  };

  if (chartDonut) return chartDonut.updateOptions(options, true, true);

  el.innerHTML = "";
  chartDonut = new ApexCharts(el, options);
  chartDonut.render();
}

async function atualizarDashboard() {
  const anoEl = document.getElementById("filtroAno");
  const mesEl = document.getElementById("filtroMes");

  const ano = Number(anoEl?.value || new Date().getFullYear());
  const mes = Number(mesEl?.value || new Date().getMonth() + 1);

  const resumo = await carregarResumo(ano, mes);

  setText("fatMensal", brl(resumo?.faturamento_mensal));
  setText("fatSemestral", brl(resumo?.faturamento_semestral));
  setText("fatAnual", brl(resumo?.faturamento_anual));

  setText(
    "mensalInfo",
    `${resumo?.qtd_pagamentos_mensal ?? 0} pagamentos • Ticket médio ${brl(resumo?.ticket_medio_mensal)}`
  );
  setText("semestreInfo", `Semestre ${resumo?.semestre ?? "-"}`);
  setText("anualInfo", `Ano ${resumo?.ano ?? ano}`);

  setText("prevMensal", brl(resumo?.previsto_mensal));
  setText("prevSemestral", brl(resumo?.previsto_semestral));
  setText("prevAnual", brl(resumo?.previsto_anual));

  const fatMes = await carregarFaturamentoPorMes(ano);
  renderBar(fatMes);

  const top = await carregarServicosTop(ano, mes);
  renderDonut(top);
}

// -------- INICIALIZAÇÃO --------
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireAuth();
  if (!ok) {
    window.location.href = "./login.html";
    return;
  }

  preencherFiltros();

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
  if (btnAtualizar) btnAtualizar.addEventListener("click", () => atualizarDashboard().catch((e) => alert(e.message)));

  const anoEl = document.getElementById("filtroAno");
  const mesEl = document.getElementById("filtroMes");

  if (anoEl) anoEl.addEventListener("change", () => atualizarDashboard().catch((e) => alert(e.message)));
  if (mesEl) mesEl.addEventListener("change", () => atualizarDashboard().catch((e) => alert(e.message)));

  atualizarDashboard().catch((e) => alert(e.message));
});
