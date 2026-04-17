// -------- API --------
function resolveApiBase() {
  if (window.location.protocol === "file:") return "http://localhost:3000/api";
  const meta = document.querySelector('meta[name="api-base"]')?.content?.trim();
  const { protocol, hostname, port } = window.location;
  const isLocalHost = hostname === "127.0.0.1" || hostname === "localhost";
  if (meta) {
    const normalized = meta.replace(/\/$/, "");
    if (isLocalHost && port && port !== "3000" && (normalized === "/api" || normalized === "api")) {
      return `${protocol}//${hostname}:3000/api`;
    }
    return normalized;
  }
  return `${window.location.origin}/api`;
}

const API = resolveApiBase();

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function postPublic(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.message || "Erro ao enviar");
  return data;
}

// -------- FEEDBACK --------
function toast(icon, title, text) {
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: "#9cff00",
    background: "#1a1a1a",
    color: "#ffffff",
  });
}

// -------- INTERAÇÕES DA PÁGINA --------
document.addEventListener("DOMContentLoaded", () => {
  // -------- MENU MOBILE --------
  const menuIcon = document.getElementById("menu-icon");
  const navList = document.getElementById("nav-list");
  const icon = menuIcon?.querySelector("i");
  const links = navList?.querySelectorAll("a") || [];

  if (menuIcon && navList && icon) {
    menuIcon.addEventListener("click", () => {
      navList.classList.toggle("active");

      if (navList.classList.contains("active")) {
        icon.classList.replace("fa-bars", "fa-xmark");
      } else {
        icon.classList.replace("fa-xmark", "fa-bars");
      }
    });

    links.forEach((link) => {
      link.addEventListener("click", () => {
        navList.classList.remove("active");
        icon.classList.replace("fa-xmark", "fa-bars");
      });
    });
  }

  // -------- MODAL DE AGENDAMENTO --------
  const btnAgendar = document.querySelector(".agendar-servicos");
  const modalAgendar = document.getElementById("modal-agendar");
  const fecharModal = document.getElementById("fechar-modal");

  if (btnAgendar && modalAgendar && fecharModal) {
    btnAgendar.addEventListener("click", () => {
      modalAgendar.classList.add("active");
    });

    fecharModal.addEventListener("click", () => {
      modalAgendar.classList.remove("active");
    });

    modalAgendar.addEventListener("click", (e) => {
      if (e.target === modalAgendar) {
        modalAgendar.classList.remove("active");
      }
    });
  }

  // -------- WHATSAPP --------
  const btnWhatsapp = document.querySelector(".whatsapp");
  if (btnWhatsapp) {
    btnWhatsapp.addEventListener("click", () => {
      window.open("https://wa.me/5561993549777", "_blank", "noopener,noreferrer");
    });
  }

  // -------- FORMULÁRIO DE AGENDAMENTO --------
  const formAgendar = document.getElementById("form-agendar");
  if (formAgendar) {
    formAgendar.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        nome: document.getElementById("agendar-nome")?.value?.trim(),
        email: document.getElementById("agendar-email")?.value?.trim(),
        telefone: document.getElementById("agendar-telefone")?.value?.trim(),
        veiculo: document.getElementById("agendar-veiculo")?.value?.trim(),
        servico: document.getElementById("agendar-servico")?.value,
        data: document.getElementById("agendar-data")?.value,
        observacoes: document.getElementById("agendar-observacoes")?.value?.trim(),
      };

      try {
        const data = await postPublic("/public/agendamentos", payload);
        await toast(
          "success",
          "Agendamento enviado!",
          `Recebemos seu pedido. Valor estimado: ${Number(data?.valor_estimado || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}.`
        );

        formAgendar.reset();
        modalAgendar?.classList.remove("active");
      } catch (err) {
        await toast("error", "Não foi possível enviar", err.message || "Tente novamente.");
      }
    });
  }

  // -------- FORMULÁRIO DE CONTATO --------
  const formContato = document.getElementById("form-contato");
  if (formContato) {
    formContato.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        nome: document.getElementById("contato-nome")?.value?.trim(),
        email: document.getElementById("contato-email")?.value?.trim(),
        telefone: document.getElementById("contato-telefone")?.value?.trim(),
        mensagem: document.getElementById("contato-mensagem")?.value?.trim(),
      };

      try {
        await postPublic("/public/contatos", payload);
        await toast("success", "Mensagem enviada!", "Obrigado pelo contato. Retornaremos em breve.");
        formContato.reset();
      } catch (err) {
        await toast("error", "Não foi possível enviar", err.message || "Tente novamente.");
      }
    });
  }
});
