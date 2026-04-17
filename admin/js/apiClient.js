function resolveApiBase() {
  if (window.location.protocol === "file:") return "http://localhost:3000/api";
  const meta = document.querySelector('meta[name="api-base"]')?.content?.trim();

  const { protocol, hostname, port, origin } = window.location;
  const isLocalHost = hostname === "127.0.0.1" || hostname === "localhost";
  if (meta) {
    const normalized = meta.replace(/\/$/, "");
    if (isLocalHost && port && port !== "3000" && (normalized === "/api" || normalized === "api")) {
      return `${protocol}//${hostname}:3000/api`;
    }
    return normalized;
  }

  if (isLocalHost && port && port !== "3000") {
    return `${protocol}//${hostname}:3000/api`;
  }
  return `${origin}/api`;
}

const API = resolveApiBase();
let accessToken = null;
let currentUser = null;
let refreshPromise = null;
const isLocalSessionFallback =
  window.location.protocol === "file:" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";
const sessionStorageKey = "lenhardt_admin_session";

function readStoredSession() {
  if (!isLocalSessionFallback) return null;

  try {
    const raw = window.sessionStorage.getItem(sessionStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      user: parsed?.user || null,
    };
  } catch {
    return null;
  }
}

function writeStoredSession({ token = null, user = null } = {}) {
  if (!isLocalSessionFallback) return;

  if (!token) {
    window.sessionStorage.removeItem(sessionStorageKey);
    return;
  }

  window.sessionStorage.setItem(
    sessionStorageKey,
    JSON.stringify({
      token,
      user: user || null,
    })
  );
}

function setSession({ token = null, user = null } = {}) {
  accessToken = token || null;
  currentUser = user || null;
  writeStoredSession({ token: accessToken, user: currentUser });
}

function clearSession() {
  accessToken = null;
  currentUser = null;
  writeStoredSession({ token: null, user: null });
}

async function parseResponse(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

async function apiRefresh() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      const data = await parseResponse(res);
      if (!res.ok) throw new Error(data?.message || "Sessão expirada.");
      if (!data.accessToken) throw new Error("Refresh inválido.");

      setSession({
        token: data.accessToken,
        user: data.user || null,
      });
      return data.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentUserRole() {
  return String(currentUser?.role || "").toLowerCase();
}

export function isCurrentUserAdmin() {
  return getCurrentUserRole() === "admin";
}

export async function requireAuth() {
  if (!accessToken) {
    const stored = readStoredSession();
    if (stored?.token) {
      accessToken = stored.token;
      currentUser = stored.user || null;
    }
  }

  if (accessToken) return accessToken;

  try {
    await apiRefresh();
    return accessToken;
  } catch {
    clearSession();
    window.location.href = "./login.html";
    return null;
  }
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  if (!accessToken) {
    const ok = await requireAuth();
    if (!ok) return null;
  }

  const doFetch = async () => {
    const headers = {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    };

    return fetch(`${API}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  if (res.status === 401) {
    try {
      await apiRefresh();
    } catch {
      clearSession();
      window.location.href = "./login.html";
      return null;
    }
    res = await doFetch();
  }

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.message || `Erro na API (${res.status})`);
  return data;
}

export async function apiLogin(email, senha) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, senha }),
  });

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.message || "Erro no login.");
  if (!data.accessToken) throw new Error("Login não retornou accessToken.");

  setSession({
    token: data.accessToken,
    user: data.user || null,
  });
  return data;
}

export async function apiPublicPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.message || "Erro na API.");
  return data;
}

export async function apiLogout() {
  try {
    await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}
