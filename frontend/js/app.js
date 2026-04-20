// Change to your Railway URL after deployment; empty string works when the API is on the same host
const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "";

// --- API helpers ---

function apiUrl(path) {
  return API_BASE + (path.startsWith("/") ? path : "/" + path);
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(path + " → " + res.status);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(path + " → " + res.status + (t ? ": " + t : ""));
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : null;
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = String(s ?? "");
  return d.innerHTML;
}

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}" class="text-muted text-center py-4">${msg}</td></tr>`;
}

function showError(msg) {
  const el = document.getElementById("api-alert");
  el.textContent = msg;
  el.classList.remove("d-none");
}

function hideError() {
  document.getElementById("api-alert").classList.add("d-none");
}

// --- Router ---
// Each page file registers itself via registerPage(name, renderFn)
const pages = {};

function registerPage(name, renderFn) {
  pages[name] = renderFn;
}

function navigate(page) {
  hideError();
  const app = document.getElementById("app");
  if (pages[page]) pages[page](app);

  document.querySelectorAll(".navbar-nav .nav-link[data-page]").forEach(link => {
    link.classList.toggle("active", link.getAttribute("data-page") === page);
  });
}

document.querySelectorAll(".navbar-nav .nav-link[data-page]").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navigate(link.getAttribute("data-page"));
  });
});

document.addEventListener("DOMContentLoaded", () => navigate("dashboard"));
